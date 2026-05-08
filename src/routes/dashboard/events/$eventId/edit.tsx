import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { ApiError } from "#/lib/api/errors";
import type { TicketTier } from "#/lib/api/schemas";
import {
	createTicketType,
	deleteEvent,
	deleteTicketType,
	fetchEventDetail,
	patchEvent,
	publishEvent,
	unpublishEvent,
	uploadEventBanner,
} from "#/lib/api/ticket-api";
import { eventsKeys } from "#/lib/query-keys";

export const Route = createFileRoute("/dashboard/events/$eventId/edit")({
	component: EditEventPage,
});

function toLocalInput(iso: string) {
	try {
		const d = new Date(iso);
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	} catch {
		return "";
	}
}

function EditEventPage() {
	const { eventId } = Route.useParams();
	const qc = useQueryClient();

	const q = useQuery({
		queryKey: eventsKeys.detail(eventId),
		queryFn: () => fetchEventDetail(eventId),
	});

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [venue, setVenue] = useState("");

	useEffect(() => {
		if (!q.data) return;
		setTitle(q.data.title);
		setDescription(q.data.description ?? "");
		setStartsAt(toLocalInput(q.data.startsAt));
		setEndsAt(toLocalInput(q.data.endsAt));
		setVenue(q.data.venue ?? "");
	}, [q.data]);

	const save = useMutation({
		mutationFn: () =>
			patchEvent(eventId, {
				title,
				description: description || undefined,
				startsAt: new Date(startsAt).toISOString(),
				endsAt: new Date(endsAt).toISOString(),
				venue: venue || undefined,
			}),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Saved");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Save failed"),
	});

	const publish = useMutation({
		mutationFn: () => publishEvent(eventId),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Published");
			void q.refetch();
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Publish failed"),
	});

	const unpublish = useMutation({
		mutationFn: () => unpublishEvent(eventId),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Unpublished");
			void q.refetch();
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Unpublish failed"),
	});

	const remove = useMutation({
		mutationFn: () => deleteEvent(eventId),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: eventsKeys.all });
			toast.success("Event deleted");
			window.location.href = "/dashboard/events";
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Delete failed"),
	});

	const banner = useMutation({
		mutationFn: (file: File) => uploadEventBanner(eventId, file),
		onSuccess: async () => {
			void q.refetch();
			toast.success("Banner updated");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Upload failed"),
	});

	const [tier, setTier] = useState<TicketTier>("GENERAL");
	const [ttName, setTtName] = useState("");
	const [ttPrice, setTtPrice] = useState("0");
	const [ttQty, setTtQty] = useState("100");

	const addTier = useMutation({
		mutationFn: () =>
			createTicketType(eventId, {
				tier,
				name: ttName,
				price: Number(ttPrice),
				quantity: Number(ttQty),
			}),
		onSuccess: async () => {
			void q.refetch();
			setTtName("");
			toast.success("Ticket type added");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Could not add tier"),
	});

	const delTier = useMutation({
		mutationFn: (id: string) => deleteTicketType(id),
		onSuccess: async () => {
			void q.refetch();
			toast.success("Removed");
		},
		onError: (e) =>
			toast.error(e instanceof ApiError ? e.message : "Could not remove"),
	});

	if (q.isPending) return <Skeleton className="h-96 rounded-xl" />;
	if (q.isError || !q.data)
		return (
			<p className="text-destructive">
				{(q.error as Error)?.message ?? "Not found"}
			</p>
		);

	const ev = q.data;

	return (
		<div className="mx-auto max-w-3xl space-y-10">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="display-title text-2xl font-semibold">Edit event</h1>
					<div className="mt-2 flex flex-wrap gap-2">
						<Badge variant={ev.published ? "default" : "secondary"}>
							{ev.published ? "Published" : "Draft"}
						</Badge>
						<span className="font-mono text-xs text-muted-foreground">
							{ev.slug}
						</span>
					</div>
				</div>
				<Button variant="ghost" asChild>
					<Link to="/dashboard/events">← All events</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Title</Label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>Description</Label>
						<Textarea
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Starts</Label>
							<Input
								type="datetime-local"
								value={startsAt}
								onChange={(e) => setStartsAt(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Ends</Label>
							<Input
								type="datetime-local"
								value={endsAt}
								onChange={(e) => setEndsAt(e.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Venue</Label>
						<Input value={venue} onChange={(e) => setVenue(e.target.value)} />
					</div>
					<Button
						type="button"
						onClick={() => save.mutate()}
						disabled={save.isPending}
					>
						Save changes
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Banner</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{ev.bannerUrl ? (
						<img
							src={ev.bannerUrl}
							alt=""
							className="max-h-48 rounded-lg border object-cover"
						/>
					) : null}
					<Input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) banner.mutate(f);
						}}
					/>
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-2">
				{ev.published ? (
					<Button
						type="button"
						variant="secondary"
						onClick={() => unpublish.mutate()}
					>
						Unpublish
					</Button>
				) : (
					<Button type="button" onClick={() => publish.mutate()}>
						Publish
					</Button>
				)}
				<Button
					type="button"
					variant="destructive"
					onClick={() => {
						if (confirm("Soft-delete this event?")) remove.mutate();
					}}
				>
					Delete
				</Button>
			</div>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Ticket types</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<ul className="space-y-2 text-sm">
						{ev.ticketTypes.map((t) => (
							<li
								key={t.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
							>
								<span>
									{t.name} ({t.tier}) — {t.quantityRemaining}/
									{t.quantityTotal ?? "?"} left
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-destructive"
									onClick={() => delTier.mutate(t.id)}
								>
									Remove
								</Button>
							</li>
						))}
					</ul>
					<div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<Label>Tier</Label>
							<Select
								value={tier}
								onValueChange={(v) => setTier(v as TicketTier)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GENERAL">GENERAL</SelectItem>
									<SelectItem value="VIP">VIP</SelectItem>
									<SelectItem value="EARLY_BIRD">EARLY_BIRD</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={ttName}
								onChange={(e) => setTtName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Price (USD)</Label>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={ttPrice}
								onChange={(e) => setTtPrice(e.target.value)}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label>Quantity</Label>
							<Input
								type="number"
								min={1}
								value={ttQty}
								onChange={(e) => setTtQty(e.target.value)}
							/>
						</div>
						<Button
							type="button"
							className="sm:col-span-2"
							onClick={() => addTier.mutate()}
							disabled={!ttName.trim() || addTier.isPending}
						>
							Add ticket type
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
