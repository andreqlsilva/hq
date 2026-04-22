// pages/downvid/server.js

const dir = new URL(".", import.meta.url).pathname;

export default {
  "POST /download": async (req) => {
    const { url: videoUrl } = await req.json();
    if (!videoUrl) return new Response("missing url", { status: 400 });

    const outPath = `${dir}output.mp4`;
    const command = new Deno.Command(`${dir}downvid.sh`, {
      args: [videoUrl, outPath],
    });

    const { code, stderr } = await command.output();
    if (code !== 0) {
      console.error(new TextDecoder().decode(stderr));
      return new Response("script failed", { status: 500 });
    }

    const fileData = await Deno.readFile(outPath);
    return new Response(fileData, {
      headers: {
        "content-type": "video/mp4",
        "content-disposition": 'attachment; filename="video.mp4"',
      },
    });
  },
};
