
// buns
// packages = ["bunup"]
import { defineConfig } from "bunup";
import { type BunPlugin } from "bun";

const myBunPlugin: BunPlugin = {
	name: "my-plugin",
	setup(_build) {
		// Bun plugin setup
		console.log("Setup: ", process.argv)
		// await $`ls dist`.then(res => console.log("Setup",res))
	},
};

export default defineConfig({
	entry: "src/index.ts",
	plugins: [myBunPlugin],
});

