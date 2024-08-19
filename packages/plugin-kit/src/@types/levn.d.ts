declare module "levn" {
	interface ParseOptions {
		explicit?: boolean;
		customTypes: Record<string, object>;
	}

	function parse(type: string, input: string, options?: ParseOptions): object;
}
