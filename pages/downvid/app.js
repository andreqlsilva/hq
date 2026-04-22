class VideoDownloader {
  constructor() {
    this.container = new Block();
    const label = new LabelElement("URL: ");
    const field = new TextInput();
    this.input = new InputBlock(label,field);
    this.button = new ControlButton("Download");
    this.button.setAction(() => this.download());
    this.container.add(this.input);
    this.container.add(this.button);
  }
  get view() { return this.container; }

  async download() {
    const videoUrl = this.input.value;
    if (!videoUrl) return this.button.flashError();

    this.button.html.textContent = "Processing...";

    try {
      const response = await fetch("/api/pages/downvid/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl })
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = "downloaded_video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      this.button.flashSuccess();
      this.button.html.textContent = "Download";
    } catch (error) {
      console.error(error);
      this.button.flashError();
      this.button.html.textContent = "Download";
    }
  }
}

class UtilityHub {
  constructor() {
    this.container = new TitledBlock("downvid");
    this.app = new VideoDownloader();
    this.container.add(this.app.view);
  }

  get view() { return this.container; }

  init() {
    document.getElementById("app").appendChild(this.view.html);
  }
}

const util = new UtilityHub();
util.init();
