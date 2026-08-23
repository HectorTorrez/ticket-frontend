import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { AdminResetPasswordResponse } from "#/lib/api/schemas";
import { adminCreateAdmin } from "#/lib/api/ticket-api";
import { adminUsersKeys } from "#/lib/query-keys";
import { apiErrorMessage, toastMutation } from "#/lib/toast-mutation";

type CreateAdminDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: (result: AdminResetPasswordResponse) => void;
};

export function CreateAdminDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateAdminDialogProps) {
	const qc = useQueryClient();
	const [email, setEmail] = useState("");

	const create = useMutation({
		mutationFn: (nextEmail: string) => {
			const request = adminCreateAdmin({ email: nextEmail });
			void toastMutation(request, {
				loading: "Creando administrador…",
				success: "Administrador creado",
				error: (e) => apiErrorMessage(e, "No se pudo crear el administrador"),
			});
			return request;
		},
		onSuccess: async (data) => {
			setEmail("");
			onOpenChange(false);
			onCreated(data);
			await qc.invalidateQueries({ queryKey: adminUsersKeys.all });
		},
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (create.isPending) return;
				if (!next) setEmail("");
				onOpenChange(next);
			}}
		>
			<DialogContent showCloseButton={false}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const nextEmail = email.trim();
						if (!nextEmail) {
							toast.error("Escribe un correo válido");
							return;
						}
						create.mutate(nextEmail);
					}}
				>
					<DialogHeader>
						<DialogTitle>Nuevo administrador</DialogTitle>
						<DialogDescription>
							Se genera una contraseña temporal. Cópiala y entrégasela por un
							canal seguro; no se vuelve a mostrar.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-4">
						<Label htmlFor="create-admin-email" required>
							Correo del administrador
						</Label>
						<p className="text-sm text-muted-foreground">
							Usará este correo para entrar al panel.
						</p>
						<Input
							id="create-admin-email"
							name="email"
							type="email"
							autoComplete="off"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="admin@ejemplo.com"
							required
							disabled={create.isPending}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={create.isPending}
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={create.isPending}>
							Crear administrador
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
