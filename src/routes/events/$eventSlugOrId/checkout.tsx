import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { PublicLayout } from "#/components/layouts/public-layout";
import { QueryErrorAlert } from "#/components/query-error-alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
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
import { useInventorySocket } from "#/routes/events/$eventSlugOrId/-hooks/use-inventory-socket";

type CheckoutLine = { ticketTypeId: string; quantity: number };
type OrderDetail = z.infer<typeof orderDetailSchema>;

function useCheckoutLines(): CheckoutLine[] | null {
	return useRouterState({
		select: (s) => {
			const st = s.location.state as { lines?: CheckoutLine[] } | undefined;
			if (!st?.lines?.length) return null;
			return st.lines;
		},
	});
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
	const lines = useCheckoutLines();
	const reserveOnce = useRef(false);

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
		if (!lines || lines.length === 0 || order || reserveOnce.current) return;
		reserveOnce.current = true;
		reserve.mutate();
	}, [lines, order, reserve]);

	const pay = useMutation({
		mutationFn: () => {
			if (!order) throw new Error("No order");
			return mockPayOrder(order.id, "SUCCESS");
		},
		onSuccess: async (paid) => {
			setOrder(paid);
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

	if (!lines || lines.length === 0) {
		return (
			<PublicLayout>
				<div className="page-wrap space-y-6 py-16">
					<p className="text-muted-foreground">No ticket selection found.</p>
					<Button asChild>
						<Link to="/events/$eventSlugOrId" params={{ eventSlugOrId }}>
							Back to event
						</Link>
					</Button>
				</div>
			</PublicLayout>
		);
	}

	if (eventQ.isPending) {
		return (
			<PublicLayout>
				<div className="page-wrap py-16">
					<Skeleton className="h-40 rounded-xl" />
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
			<div className="page-wrap max-w-2xl space-y-8 py-12">
				<div>
					<h1 className="display-title text-2xl font-semibold">Checkout</h1>
					<p className="mt-1 text-muted-foreground">{ev.title}</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Your selection</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{lines.map((l) => {
							const tt = ev.ticketTypes.find((t) => t.id === l.ticketTypeId);
							if (!tt) return null;
							return (
								<div
									key={l.ticketTypeId}
									className="flex justify-between gap-2"
								>
									<span>
										{tt.name} × {l.quantity}
									</span>
									<span className="text-muted-foreground">
										{new Intl.NumberFormat(undefined, {
											style: "currency",
											currency: "USD",
										}).format(Number(tt.price) * l.quantity)}
									</span>
								</div>
							);
						})}
					</CardContent>
				</Card>

				{reserve.isPending && !order ? (
					<p className="text-sm text-muted-foreground">Creating reservation…</p>
				) : null}

				{reserve.isError ? (
					<p className="text-sm text-destructive">
						{getUserFacingErrorMessage(reserve.error)}
					</p>
				) : null}

				{order ? (
					<Card className="border-primary/30">
						<CardHeader>
							<CardTitle className="text-base">Reservation</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-2xl font-semibold">
								{new Intl.NumberFormat(undefined, {
									style: "currency",
									currency: order.currency,
								}).format(Number(order.totalAmount))}
							</p>
							<p className="text-sm text-muted-foreground">
								Status: <strong>{order.status}</strong>
								{secondsLeft !== null ? (
									<>
										{" "}
										· Expires in {Math.floor(secondsLeft / 60)}:
										{String(secondsLeft % 60).padStart(2, "0")}
									</>
								) : null}
							</p>
							{order.status === "PENDING" ? (
								<div className="flex flex-wrap gap-2">
									<Button onClick={() => pay.mutate()} disabled={pay.isPending}>
										Complete payment
									</Button>
									<Button
										variant="outline"
										onClick={() => cancelMu.mutate()}
										disabled={cancelMu.isPending}
									>
										Cancel hold
									</Button>
								</div>
							) : null}
						</CardContent>
					</Card>
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
