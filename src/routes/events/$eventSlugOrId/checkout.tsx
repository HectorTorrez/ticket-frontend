import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { Check, Clock, CreditCard, Ticket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { PublicLayout } from "#/components/layouts/public-layout";
import { QueryErrorAlert } from "#/components/query-error-alert";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { ApiError, getUserFacingErrorMessage } from "#/lib/api/errors";
import type { orderDetailSchema } from "#/lib/api/schemas";
import {
	cancelOrder,
	createOrder,
	fetchEventDetail,
	mockPayOrder,
} from "#/lib/api/ticket-api";
import { requireCustomer } from "#/lib/auth/guards";
import { eventsKeys, ordersKeys, ticketsKeys } from "#/lib/query-keys";
import { cn } from "#/lib/utils";
import { useInventorySocket } from "#/routes/events/$eventSlugOrId/-hooks/use-inventory-socket";

type CheckoutLine = { ticketTypeId: string; quantity: number };
type OrderDetail = z.infer<typeof orderDetailSchema>;

const checkoutLinesKey = (eventSlugOrId: string) =>
	`checkout-lines:${eventSlugOrId}`;

const HOLD_SECONDS = 15 * 60;

function readStoredLines(eventSlugOrId: string): CheckoutLine[] | null {
	try {
		const raw = sessionStorage.getItem(checkoutLinesKey(eventSlugOrId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CheckoutLine[];
		return parsed.length > 0 ? parsed : null;
	} catch {
		return null;
	}
}

function storeLines(eventSlugOrId: string, lines: CheckoutLine[]) {
	try {
		sessionStorage.setItem(
			checkoutLinesKey(eventSlugOrId),
			JSON.stringify(lines),
		);
	} catch {
		/* quota / private mode */
	}
}

function useCheckoutLines(eventSlugOrId: string): CheckoutLine[] | null {
	const fromState = useRouterState({
		select: (s) => {
			const st = s.location.state as { lines?: CheckoutLine[] } | undefined;
			if (!st?.lines?.length) return null;
			return st.lines;
		},
	});

	const [stored] = useState(() => readStoredLines(eventSlugOrId));

	const lines = fromState ?? stored;

	useEffect(() => {
		if (lines?.length) storeLines(eventSlugOrId, lines);
	}, [eventSlugOrId, lines]);

	return lines;
}

export const Route = createFileRoute("/events/$eventSlugOrId/checkout")({
	beforeLoad: () => {
		requireCustomer();
	},
	component: CheckoutPage,
});

function CheckoutPage() {
	const { eventSlugOrId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const lines = useCheckoutLines(eventSlugOrId);
	const autoReserveAttempted = useRef(false);

	const [order, setOrder] = useState<OrderDetail | null>(null);

	const eventQ = useQuery({
		queryKey: eventsKeys.detail(eventSlugOrId),
		queryFn: () => fetchEventDetail(eventSlugOrId),
	});

	useInventorySocket(eventSlugOrId, eventQ.data?.id);

	const reserve = useMutation({
		mutationFn: () => {
			if (!lines?.length) throw new Error("No ticket lines");
			return createOrder(lines);
		},
		onSuccess: (o) => {
			setOrder(o);
			void qc.invalidateQueries({ queryKey: eventsKeys.detail(eventSlugOrId) });
		},
		onError: (e) => {
			toast.error(getUserFacingErrorMessage(e));
		},
	});

	useEffect(() => {
		if (!lines || lines.length === 0 || order || autoReserveAttempted.current)
			return;
		autoReserveAttempted.current = true;
		reserve.mutate();
	}, [lines, order, reserve]);

	const pay = useMutation({
		mutationFn: () => {
			if (!order) throw new Error("No order");
			return mockPayOrder(order.id, "SUCCESS");
		},
		onSuccess: async (paid) => {
			setOrder(paid);
			if (paid.status !== "PAID") {
				toast.error(
					paid.status === "EXPIRED"
						? "Your reservation expired. Please start checkout again."
						: "Payment could not be completed.",
				);
				return;
			}
			try {
				sessionStorage.removeItem(checkoutLinesKey(eventSlugOrId));
			} catch {
				/* ignore */
			}
			await qc.invalidateQueries({ queryKey: ordersKeys.all });
			await qc.invalidateQueries({ queryKey: ticketsKeys.all });
			await qc.invalidateQueries({
				queryKey: eventsKeys.detail(eventSlugOrId),
			});
			toast.success("Payment completed successfully");
			void navigate({
				to: "/my-orders/$orderId",
				params: { orderId: paid.id },
			});
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Payment request failed"),
	});

	const cancelMu = useMutation({
		mutationFn: () => {
			if (!order) throw new Error("No order");
			return cancelOrder(order.id);
		},
		onSuccess: async () => {
			toast.message("Reservation cancelled");
			await qc.invalidateQueries({
				queryKey: eventsKeys.detail(eventSlugOrId),
			});
			void navigate({
				to: "/events/$eventSlugOrId",
				params: { eventSlugOrId },
			});
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Could not cancel"),
	});

	const expiresAt = order?.expiresAt;
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!expiresAt) return;
		const t = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(t);
	}, [expiresAt]);

	const secondsLeft = useMemo(() => {
		if (!expiresAt) return null;
		const end = new Date(expiresAt).getTime();
		return Math.max(0, Math.floor((end - now) / 1000));
	}, [expiresAt, now]);

	const progress = useMemo(() => {
		if (secondsLeft === null) return 1;
		return secondsLeft / HOLD_SECONDS;
	}, [secondsLeft]);

	const selectionTotal = useMemo(() => {
		if (!eventQ.data || !lines) return 0;
		return lines.reduce((sum, l) => {
			const tt = eventQ.data?.ticketTypes.find((t) => t.id === l.ticketTypeId);
			if (!tt) return sum;
			return sum + Number(tt.price) * l.quantity;
		}, 0);
	}, [eventQ.data, lines]);

	const currentStep = order?.status === "PENDING" ? 2 : order ? 2 : 1;

	if (!lines || lines.length === 0) {
		return (
			<PublicLayout>
				<div className="page-wrap space-y-6 py-16">
					<div className="island-shell rounded-xl p-10 text-center">
						<Ticket className="mx-auto size-10 text-muted-foreground/50" />
						<p className="mt-4 text-muted-foreground">
							No ticket selection found.
						</p>
						<Button className="mt-6" asChild>
							<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
								Back to event
							</Link>
						</Button>
					</div>
				</div>
			</PublicLayout>
		);
	}

	if (eventQ.isPending) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">
					<Skeleton className="h-64 rounded-xl" />
				</div>
			</PublicLayout>
		);
	}

	if (eventQ.isError) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">
					<QueryErrorAlert
						title="We couldn't load checkout"
						error={eventQ.error}
					/>
				</div>
			</PublicLayout>
		);
	}

	if (!eventQ.data) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16 text-muted-foreground">
					Event data unavailable.
				</div>
			</PublicLayout>
		);
	}

	const ev = eventQ.data;

	return (
		<PublicLayout>
			<div className="page-wrap max-w-xl space-y-8 py-12 md:py-16">
				<div className="rise-in">
					<p className="island-kicker">Checkout</p>
					<h1 className="display-title mt-2 text-2xl font-semibold md:text-3xl">
						{ev.title}
					</h1>
				</div>

				{/* Steps */}
				<ol className="rise-in stagger-1 flex items-center gap-2 text-sm">
					{[
						{ n: 1, label: "Selection", icon: Ticket },
						{ n: 2, label: "Payment", icon: CreditCard },
						{ n: 3, label: "Done", icon: Check },
					].map((s, i) => (
						<li key={s.n} className="flex items-center gap-2">
							{i > 0 ? (
								<span className="h-px w-6 bg-border sm:w-10" />
							) : null}
							<span
								className={cn(
									"flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors",
									currentStep >= s.n
										? "bg-primary/10 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								<s.icon className="size-3.5" />
								{s.label}
							</span>
						</li>
					))}
				</ol>

				{/* Selection summary */}
				<div className="ticket-edge island-shell rise-in stagger-2 rounded-xl p-6">
					<h2 className="font-semibold">Your selection</h2>
					<ul className="mt-4 space-y-3 text-sm">
						{lines.map((l) => {
							const tt = ev.ticketTypes.find((t) => t.id === l.ticketTypeId);
							if (!tt) return null;
							return (
								<li
									key={l.ticketTypeId}
									className="flex justify-between gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0"
								>
									<span>
										{tt.name} × {l.quantity}
									</span>
									<span className="font-medium">
										{new Intl.NumberFormat(undefined, {
											style: "currency",
											currency: "USD",
										}).format(Number(tt.price) * l.quantity)}
									</span>
								</li>
							);
						})}
					</ul>
					<div className="mt-4 flex justify-between border-t border-border/60 pt-4 font-semibold">
						<span>Subtotal</span>
						<span>
							{new Intl.NumberFormat(undefined, {
								style: "currency",
								currency: "USD",
							}).format(selectionTotal)}
						</span>
					</div>
				</div>

				{reserve.isPending && !order ? (
					<p className="text-sm text-muted-foreground">
						Holding your seats…
					</p>
				) : null}

				{reserve.isError ? (
					<div className="island-shell space-y-3 rounded-xl p-6">
						<p className="text-sm text-destructive">
							{getUserFacingErrorMessage(reserve.error)}
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => reserve.mutate()}
							disabled={reserve.isPending}
						>
							Retry reservation
						</Button>
					</div>
				) : null}

				{order ? (
					<div className="ticket-edge island-shell rise-in rounded-xl border-primary/30 p-6">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<h2 className="font-semibold">Reservation held</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Status: <strong>{order.status}</strong>
								</p>
							</div>
							{secondsLeft !== null && order.status === "PENDING" ? (
								<div
									className="countdown-ring"
									style={
										{ "--progress": progress } as React.CSSProperties
									}
								>
									<div className="countdown-ring-inner">
										<span className="flex flex-col items-center leading-tight">
											<Clock className="mb-0.5 size-3 text-phosphor" />
											{Math.floor(secondsLeft / 60)}:
											{String(secondsLeft % 60).padStart(2, "0")}
										</span>
									</div>
								</div>
							) : null}
						</div>

						<p className="mt-4 text-3xl font-semibold">
							{new Intl.NumberFormat(undefined, {
								style: "currency",
								currency: order.currency,
							}).format(Number(order.totalAmount))}
						</p>

						{order.status === "PENDING" ? (
							<div className="mt-6 flex flex-wrap gap-2">
								<Button
									size="lg"
									className="gap-2"
									onClick={() => pay.mutate()}
									disabled={pay.isPending}
								>
									<CreditCard className="size-4" />
									Complete payment
								</Button>
								<Button
									variant="outline"
									onClick={() => cancelMu.mutate()}
									disabled={cancelMu.isPending}
								>
									Release hold
								</Button>
							</div>
						) : null}
					</div>
				) : null}

				<Button variant="ghost" asChild>
					<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
						← Edit selection
					</Link>
				</Button>
			</div>
		</PublicLayout>
	);
}
