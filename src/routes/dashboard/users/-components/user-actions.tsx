import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Ban,
	Copy,
	KeyRound,
	MoreHorizontal,
	Pause,
	Play,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ApiError } from "#/lib/api/errors";
import type {
	AdminResetPasswordResponse,
	AdminUser,
	UserStatus,
} from "#/lib/api/schemas";
import {
	adminDeleteUser,
	adminResetPasswordById,
	adminSetUserStatus,
} from "#/lib/api/ticket-api";
import { adminUsersKeys } from "#/lib/query-keys";
import { toastMutation } from "#/lib/toast-mutation";

type ConfirmKind = "suspend" | "unsuspend" | "ban" | "unban" | "delete";

const confirmCopy: Record<
	ConfirmKind,
	{ title: string; description: string; action: string; destructive?: boolean }
> = {
	suspend: {
		title: "Suspender cuenta",
		description:
			"No podrá iniciar sesión hasta que la reactives. Los pedidos y boletos se conservan.",
		action: "Suspender",
	},
	unsuspend: {
		title: "Reactivar cuenta",
		description:
			"El usuario podrá volver a iniciar sesión con su contraseña actual.",
		action: "Reactivar",
	},
	ban: {
		title: "Bloquear cuenta",
		description:
			"Queda bloqueada por abuso o incumplimiento. No podrá iniciar sesión hasta que la desbloquees.",
		action: "Bloquear",
		destructive: true,
	},
	unban: {
		title: "Desbloquear cuenta",
		description:
			"El usuario podrá volver a iniciar sesión con su contraseña actual.",
		action: "Desbloquear",
	},
	delete: {
		title: "Eliminar cuenta",
		description:
			"Se oculta del listado y se cierran sus sesiones. Los pedidos y boletos se conservan.",
		action: "Eliminar",
		destructive: true,
	},
};

type UserActionsProps = {
	user: AdminUser;
	isSelf: boolean;
	onPasswordReset: (result: AdminResetPasswordResponse) => void;
};

export function UserActions({
	user,
	isSelf,
	onPasswordReset,
}: UserActionsProps) {
	const qc = useQueryClient();
	const [confirm, setConfirm] = useState<ConfirmKind | null>(null);

	const resetPassword = useMutation({
		mutationFn: () => {
			const request = adminResetPasswordById(user.id);
			void toastMutation(request, {
				loading: "Generando contraseña temporal…",
				success: "Contraseña temporal generada",
				error: (e) =>
					e instanceof ApiError
						? e.message
						: "No se pudo restablecer la contraseña",
			});
			return request;
		},
		onSuccess: (data) => {
			onPasswordReset(data);
		},
	});

	const setStatus = useMutation({
		mutationFn: (status: UserStatus) =>
			toastMutation(
				adminSetUserStatus(user.id, status).then(async (row) => {
					await qc.invalidateQueries({ queryKey: adminUsersKeys.all });
					return row;
				}),
				{
					loading: "Actualizando cuenta…",
					success: (row) =>
						row.status === "ACTIVE"
							? "Cuenta reactivada"
							: row.status === "SUSPENDED"
								? "Cuenta suspendida"
								: "Cuenta bloqueada",
					error: (e) =>
						e instanceof ApiError
							? e.message
							: "No se pudo actualizar la cuenta",
				},
			),
	});

	const remove = useMutation({
		mutationFn: () =>
			toastMutation(
				adminDeleteUser(user.id).then(async (result) => {
					await qc.invalidateQueries({ queryKey: adminUsersKeys.all });
					return result;
				}),
				{
					loading: "Eliminando cuenta…",
					success: "Cuenta eliminada",
					error: (e) =>
						e instanceof ApiError ? e.message : "No se pudo eliminar la cuenta",
				},
			),
	});

	const busy =
		resetPassword.isPending || setStatus.isPending || remove.isPending;

	function runConfirm(kind: ConfirmKind) {
		if (kind === "suspend") setStatus.mutate("SUSPENDED");
		else if (kind === "unsuspend" || kind === "unban")
			setStatus.mutate("ACTIVE");
		else if (kind === "ban") setStatus.mutate("BANNED");
		else remove.mutate();
		setConfirm(null);
	}

	if (isSelf) {
		return <span className="text-xs text-muted-foreground">Eres tú</span>;
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="icon-xs"
						aria-label={`Acciones para ${user.email}`}
						disabled={busy}
					>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuItem
						disabled={busy}
						onClick={() => resetPassword.mutate()}
					>
						<KeyRound />
						Restablecer contraseña
					</DropdownMenuItem>
					{user.status === "ACTIVE" ? (
						<DropdownMenuItem
							disabled={busy}
							onClick={() => setConfirm("suspend")}
						>
							<Pause />
							Suspender
						</DropdownMenuItem>
					) : user.status === "SUSPENDED" ? (
						<DropdownMenuItem
							disabled={busy}
							onClick={() => setConfirm("unsuspend")}
						>
							<Play />
							Reactivar
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem
							disabled={busy}
							onClick={() => setConfirm("unban")}
						>
							<Play />
							Desbloquear
						</DropdownMenuItem>
					)}
					{user.status !== "BANNED" ? (
						<DropdownMenuItem
							variant="destructive"
							disabled={busy}
							onClick={() => setConfirm("ban")}
						>
							<Ban />
							Bloquear
						</DropdownMenuItem>
					) : null}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						disabled={busy}
						onClick={() => setConfirm("delete")}
					>
						<Trash2 />
						Eliminar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				open={confirm !== null}
				onOpenChange={(open) => {
					if (!open) setConfirm(null);
				}}
			>
				<DialogContent showCloseButton={false}>
					{confirm ? (
						<>
							<DialogHeader>
								<DialogTitle>{confirmCopy[confirm].title}</DialogTitle>
								<DialogDescription>
									{confirmCopy[confirm].description}{" "}
									<span className="font-medium text-foreground">
										{user.email}
									</span>
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setConfirm(null)}
								>
									Cancelar
								</Button>
								<Button
									type="button"
									variant={
										confirmCopy[confirm].destructive ? "destructive" : "default"
									}
									onClick={() => runConfirm(confirm)}
								>
									{confirmCopy[confirm].action}
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}

export function TemporaryPasswordDialog({
	result,
	onClose,
	created,
}: {
	result: AdminResetPasswordResponse | null;
	onClose: () => void;
	created?: boolean;
}) {
	const copyPassword = async () => {
		if (!result?.temporaryPassword) return;
		try {
			await navigator.clipboard.writeText(result.temporaryPassword);
			toast.success("Contraseña copiada");
		} catch {
			toast.error("No se pudo copiar al portapapeles");
		}
	};

	return (
		<Dialog
			open={result !== null}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>
						{created ? "Administrador creado" : "Contraseña temporal generada"}
					</DialogTitle>
					<DialogDescription>
						Cópiala ahora; no se volverá a mostrar. Entrégasela al usuario por
						un canal seguro.
					</DialogDescription>
				</DialogHeader>
				{result?.user ? (
					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Usuario:{" "}
							<span className="font-medium text-foreground">
								{result.user.email}
							</span>
						</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
								{result.temporaryPassword}
							</code>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => void copyPassword()}
								aria-label="Copiar contraseña"
							>
								<Copy className="size-4" />
							</Button>
						</div>
					</div>
				) : null}
				<DialogFooter>
					<Button type="button" onClick={onClose}>
						Listo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
