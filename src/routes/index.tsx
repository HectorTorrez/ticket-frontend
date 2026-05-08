import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "#/components/layouts/public-layout";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<PublicLayout>
			<section className="page-wrap space-y-12 py-16 md:py-20">
				<div className="rise-in max-w-3xl space-y-6">
					<p className="island-kicker">Digital ticketing MVP</p>
					<h1 className="display-title text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
						Calm, fast events — from listing to QR at the door
					</h1>
					<p className="text-lg text-muted-foreground md:text-xl">
						Browse upcoming shows, hold inventory in real time, complete a mock
						checkout, and keep passes in one place. Organizers use the dashboard
						to publish events and validate QR codes.
					</p>
					<div className="flex flex-wrap gap-3 pt-2">
						<Button size="lg" asChild>
							<Link to="/events">Browse events</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link to="/register">Create account</Link>
						</Button>
					</div>
				</div>
				<div
					className="grid gap-4 rise-in md:grid-cols-3"
					style={{ animationDelay: "120ms" }}
				>
					{[
						{
							title: "Live inventory",
							body: "Socket.IO updates ticket counts while customers shop — no stale “sold out” surprises.",
						},
						{
							title: "Mock payments",
							body: "Exercise the full reserve → pay → issue ticket flow without plugging in a processor.",
						},
						{
							title: "Role-aware UI",
							body: "Customers see tickets and receipts; admins manage events, tiers, orders, and scanning.",
						},
					].map((c) => (
						<div
							key={c.title}
							className="feature-card rounded-xl border border-border/80 p-6"
						>
							<h2 className="font-semibold">{c.title}</h2>
							<p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
						</div>
					))}
				</div>
			</section>
		</PublicLayout>
	);
}
