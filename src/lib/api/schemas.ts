import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "CUSTOMER"]);
export const orderStatusSchema = z.enum([
	"PENDING",
	"PAID",
	"FAILED",
	"EXPIRED",
	"CANCELLED",
]);
export const ticketStatusSchema = z.enum(["ACTIVE", "USED", "CANCELLED"]);
export const ticketTierSchema = z.enum(["GENERAL", "VIP", "EARLY_BIRD"]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketTier = z.infer<typeof ticketTierSchema>;

export const userSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	role: userRoleSchema,
});

export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
export const ticketTypeListSummarySchema = z.object({
	id: z.string().uuid(),
	tier: ticketTierSchema,
	name: z.string(),
	price: z.string(),
	quantityRemaining: z.number(),
	saleStartsAt: z.string().nullable().optional(),
	saleEndsAt: z.string().nullable().optional(),
});

export const ticketTypeFullSchema = ticketTypeListSummarySchema
	.extend({
		eventId: z.string().uuid().optional(),
		quantityTotal: z.number().optional(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
	})
	.catchall(z.unknown());

export const eventListItemSchema = z.object({
	id: z.string().uuid(),
	organizerId: z.string().uuid(),
	title: z.string(),
	slug: z.string(),
	description: z.string().nullable().optional(),
	startsAt: z.string(),
	endsAt: z.string(),
	venue: z.string().nullable().optional(),
	published: z.boolean(),
	bannerKey: z.string().nullable().optional(),
	bannerUrl: z.string().nullable().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().nullable().optional(),
	ticketTypes: z.array(ticketTypeListSummarySchema),
});

export const eventDetailSchema = eventListItemSchema.extend({
	ticketTypes: z.array(ticketTypeFullSchema),
});

export const paginatedEventsSchema = z.object({
	items: z.array(eventListItemSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});

export const ticketTypeSummaryNestedSchema = z.object({
	tier: ticketTierSchema,
	name: z.string(),
	price: z.string(),
});

export const orderLineCustomerListSchema = z.object({
	id: z.string().uuid(),
	orderId: z.string().uuid(),
	ticketTypeId: z.string().uuid(),
	quantity: z.number(),
	unitPrice: z.string(),
	ticketType: ticketTypeSummaryNestedSchema,
});

export const orderCustomerListItemSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	status: orderStatusSchema,
	currency: z.string(),
	totalAmount: z.string(),
	expiresAt: z.string().nullable(),
	paidAt: z.string().nullable(),
	paymentReference: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	lines: z.array(orderLineCustomerListSchema),
});

export const paginatedCustomerOrdersSchema = z.object({
	items: z.array(orderCustomerListItemSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});

export const orderLineDetailSchema = z.object({
	id: z.string().uuid(),
	orderId: z.string().uuid(),
	ticketTypeId: z.string().uuid(),
	quantity: z.number(),
	unitPrice: z.string(),
	ticketType: ticketTypeFullSchema,
});

export const orderDetailSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	status: orderStatusSchema,
	currency: z.string(),
	totalAmount: z.string(),
	expiresAt: z.string().nullable(),
	paidAt: z.string().nullable(),
	paymentReference: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	lines: z.array(orderLineDetailSchema),
});

export const orderLineAdminSchema = z.object({
	id: z.string().uuid(),
	ticketTypeId: z.string().uuid(),
	quantity: z.number(),
	unitPrice: z.string(),
	ticketType: ticketTypeFullSchema,
});

export const adminOrderItemSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	status: orderStatusSchema,
	currency: z.string(),
	totalAmount: z.string(),
	expiresAt: z.string().nullable(),
	paidAt: z.string().nullable(),
	paymentReference: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	user: userSchema,
	lines: z.array(orderLineAdminSchema),
});

export const paginatedAdminOrdersSchema = z.object({
	items: z.array(adminOrderItemSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});

export const myTicketEventSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	slug: z.string(),
	startsAt: z.string(),
	venue: z.string().nullable().optional(),
});

export const myTicketTypeSchema = z.object({
	tier: ticketTierSchema,
	name: z.string(),
});

export const myTicketSchema = z.object({
	id: z.string().uuid(),
	publicCode: z.string(),
	orderLineId: z.string().uuid(),
	userId: z.string().uuid(),
	eventId: z.string().uuid(),
	ticketTypeId: z.string().uuid(),
	status: ticketStatusSchema,
	usedAt: z.string().nullable(),
	validatedByUserId: z.string().nullable().optional(),
	event: myTicketEventSchema,
	ticketType: myTicketTypeSchema,
});

export const publicTicketSchema = z.object({
	publicCode: z.string(),
	status: ticketStatusSchema,
	event: z.object({
		title: z.string(),
		startsAt: z.string(),
		slug: z.string(),
	}),
	ticketType: myTicketTypeSchema,
});

export const dashboardSummarySchema = z.object({
	ticketsSold: z.number(),
	totalRevenue: z.string(),
	activeEvents: z.number(),
	remainingInventory: z.number(),
});

export const ticketsUpdatePayloadSchema = z.object({
	eventId: z.string().uuid(),
	ticketTypeId: z.string().uuid(),
	remaining: z.number(),
	updatedAt: z.string(),
});

export const qrValidateResultSchema = z.object({
	result: z.enum(["VALID", "ALREADY_USED", "INVALID"]),
});

export const logoutResponseSchema = z.object({
	loggedOut: z.boolean(),
});

export const deleteResponseSchema = z.object({
	deleted: z.boolean(),
});

export const cancelOrderResponseSchema = z.object({
	cancelled: z.boolean(),
});
