import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

import { MainWindow } from "./window.js";

Adw.init();

const app = new Adw.Application({
    application_id: "io.vncl.sudofahh.nimble"
});

app.connect("activate", () => {

    const win = new MainWindow(app);

    win.present();
});

app.run([]);
