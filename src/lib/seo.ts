import type { z } from "zod";
import type { eventDetailSchema, eventListItemSchema } from "#/lib/api/schemas";

type EventDetail = z.infer<typeof eventDetailSchema>;
type EventListItem = z.infer<typeof eventListItemSchema>;

export const site = {
	name: "Tide Tickets",
	tagline: "Cartelera, entradas y pases digitales",
	description:
		"Compra entradas para eventos en vivo con cupo en tiempo real, reserva temporizada y pases QR listos para la puerta.",
	locale: "es_SV",
	twitterHandle: "@tidetickets",
	defaultOgImage: "/logo512.png",
} as const;

export function getSiteOrigin() {
	if (typeof window !== "undefined") return window.location.origin;
	return import.meta.env.VITE_SITE_URL ?? "https://tidetickets.com";
}

export function absoluteUrl(path: string) {
	const origin = getSiteOrigin();
	return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

type MetaTag =
	| { title: string }
	| { name: string; content: string }
	| { property: string; content: string }
	| { rel: string; href: string };

export function buildSiteMeta(overrides?: {
	title?: string;
	description?: string;
	path?: string;
	image?: string;
	noIndex?: boolean;
}): { meta: MetaTag[]; links: { rel: string; href: string }[] } {
	const title = overrides?.title ?? `${site.name} — ${site.tagline}`;
	const description = overrides?.description ?? site.description;
	const url = absoluteUrl(overrides?.path ?? "/");
	const image = absoluteUrl(overrides?.image ?? site.defaultOgImage);

	const meta: MetaTag[] = [
		{ title },
		{ name: "description", content: description },
		{ name: "robots", content: overrides?.noIndex ? "noindex, nofollow" : "index, follow" },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: site.name },
		{ property: "og:locale", content: site.locale },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:image", content: image },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: image },
	];

	return {
		meta,
		links: [{ rel: "canonical", href: url }],
	};
}

export function buildEventMeta(event: EventDetail | EventListItem) {
	const when = new Intl.DateTimeFormat("es", {
		dateStyle: "long",
		timeStyle: "short",
	}).format(new Date(event.startsAt));
	const venue = event.venue ?? "lugar por confirmar";
	const description =
		"description" in event && event.description
			? event.description.slice(0, 155)
			: `Entradas para ${event.title} el ${when} en ${venue}. Cupo en vivo y pase QR al pagar.`;

	return buildSiteMeta({
		title: `${event.title} — entradas | ${site.name}`,
		description,
		path: `/events/${event.slug}`,
		image: event.bannerUrl ?? site.defaultOgImage,
	});
}

export function organizationJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: site.name,
		url: getSiteOrigin(),
		description: site.description,
	};
}

export function websiteJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: site.name,
		url: getSiteOrigin(),
		description: site.description,
		inLanguage: "es",
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${getSiteOrigin()}/events?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}

export function eventJsonLd(event: EventDetail) {
	const offers =
		event.ticketTypes.length > 0
			? event.ticketTypes.map((t) => ({
					"@type": "Offer",
					name: t.name,
					price: Number(t.price),
					priceCurrency: "USD",
					availability:
						t.quantityRemaining > 0
							? "https://schema.org/InStock"
							: "https://schema.org/SoldOut",
					url: absoluteUrl(`/events/${event.slug}`),
				}))
			: undefined;

	return {
		"@context": "https://schema.org",
		"@type": "Event",
		name: event.title,
		description: event.description ?? site.description,
		startDate: event.startsAt,
		eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
		eventStatus: "https://schema.org/EventScheduled",
		location: {
			"@type": "Place",
			name: event.venue ?? "Por confirmar",
		},
		image: event.bannerUrl ? [event.bannerUrl] : undefined,
		url: absoluteUrl(`/events/${event.slug}`),
		organizer: {
			"@type": "Organization",
			name: site.name,
			url: getSiteOrigin(),
		},
		offers,
	};
}
