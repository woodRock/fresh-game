// routes/index.tsx
import { Head } from "$fresh/runtime.ts";
import Game from "../islands/Game.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Three.js Game in Deno Fresh</title>
        <meta name="description" content="A simple Three.js game built with Deno Fresh" />
      </Head>
      <Game />
    </>
  );
}