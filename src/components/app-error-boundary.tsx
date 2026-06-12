import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "#/components/ui/button";

type Props = { children: ReactNode };

type State = { hasError: boolean; message?: string };

export class AppErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, message: error.message };
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		if (import.meta.env.DEV) console.error(error, info);
	}

	override render() {
		if (this.state.hasError) {
			return (
				<div className="page-wrap py-20">
					<div className="island-shell rounded-xl p-8">
						<h1 className="display-title text-2xl font-semibold">
							Algo salió mal
						</h1>
						<p className="mt-2 text-muted-foreground">
							{this.state.message ?? "Ocurrió un error inesperado."}
						</p>
						<Button
							className="mt-6"
							type="button"
							onClick={() => window.location.reload()}
						>
							Recargar página
						</Button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
