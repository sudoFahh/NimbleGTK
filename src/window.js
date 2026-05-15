import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import Gdk from "gi://Gdk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject";

import { Editor } from "./editor.js";
import { settings } from "./settings.js";

export const MainWindow = GObject.registerClass(
    class MainWindow extends Adw.ApplicationWindow {

        constructor(app) {

            super({
                application: app,
                title: "Nimble",
                default_width: 1200,
                default_height: 800
            });

            this.editor = new Editor();
            this.currentFile = null;
            this.isDirty = false;

            this.update_title();

            this.editor.buffer.connect("changed", () => {
                if (!this.editor.ignoreBufferChanges) {
                    this.set_dirty(true);
                }
            });

            // -------------------------
            // HEADER BAR
            // -------------------------
            const toolbar = new Adw.HeaderBar();

            const openButton = new Gtk.Button({
                label: "Open"
            });

            const saveButton = new Gtk.Button({
                label: "Save"
            });

            const saveAsButton = new Gtk.Button({
                label: "Save As"
            });

            const settingsButton = new Gtk.Button({
                icon_name: "emblem-system-symbolic"
            });

            openButton.connect("clicked", () => {
                this.open_file();
            });

            saveButton.connect("clicked", () => {
                this.save_file();
            });

            saveAsButton.connect("clicked", () => {
                this.save_file_as();
            });

            settingsButton.connect("clicked", () => {
                this.show_settings();
            });

            toolbar.pack_start(openButton);
            toolbar.pack_start(saveButton);
            toolbar.pack_start(saveAsButton);
            toolbar.pack_end(settingsButton);

            // -------------------------
            // EDITOR AREA
            // -------------------------
            const scroller = new Gtk.ScrolledWindow({
                hexpand: true,
                vexpand: true,
                child: this.editor.view
            });

            const box = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL
            });

            box.append(toolbar);
            box.append(scroller);

            this.set_content(box);

            const keyController = new Gtk.EventControllerKey();
            keyController.connect("key-pressed", (controller, keyval, keycode, state) => {
                const isCtrl = state & Gdk.ModifierType.CONTROL_MASK;
                const isShift = state & Gdk.ModifierType.SHIFT_MASK;

                if (!isCtrl)
                    return false;

                if (keyval === Gdk.KEY_plus || keyval === Gdk.KEY_equal || keyval === Gdk.KEY_KP_Add) {
                    this.editor.zoomIn();
                    return true;
                }

                if (keyval === Gdk.KEY_minus || keyval === Gdk.KEY_KP_Subtract) {
                    this.editor.zoomOut();
                    return true;
                }

                if (keyval === Gdk.KEY_o || keyval === Gdk.KEY_O) {
                    this.open_file();
                    return true;
                }

                if (keyval === Gdk.KEY_s || keyval === Gdk.KEY_S) {
                    if (isShift) {
                        this.save_file_as();
                    } else {
                        this.save_file();
                    }
                    return true;
                }

                return false;
            });

            this.add_controller(keyController);
        }

        // -------------------------
        // SETTINGS WINDOW
        // -------------------------
        show_settings() {

            const prefs = new Adw.PreferencesWindow({
                transient_for: this,
                modal: true,
                title: "Settings"
            });

            const page = new Adw.PreferencesPage();

            const group = new Adw.PreferencesGroup({
                title: "Editor Settings"
            });

            // FONT FAMILY
            const fontRow = new Adw.EntryRow({
                title: "Font Family"
            });

            fontRow.set_text(settings.get_string("font-family"));

            fontRow.connect("changed", () => {
                settings.set_string("font-family", fontRow.get_text());
            });

            group.add(fontRow);

            // FONT SIZE
            const sizeRow = new Adw.SpinRow({
                title: "Font Size"
            });

            sizeRow.set_range(10, 40);
            sizeRow.set_value(settings.get_int("font-size"));

            sizeRow.connect("notify::value", () => {
                settings.set_int("font-size", sizeRow.get_value());
            });

            group.add(sizeRow);

            // LINE HEIGHT
            const lineRow = new Adw.SpinRow({
                title: "Line Height"
            });

            lineRow.set_range(1.0, 2.5);
            lineRow.set_digits(1);
            lineRow.set_value(settings.get_double("line-height"));

            lineRow.connect("notify::value", () => {
                settings.set_double("line-height", lineRow.get_value());
            });

            group.add(lineRow);

            // SHOW LINE NUMBERS
            const showLineNumbersRow = new Adw.SwitchRow({
                title: "Show line numbers",
                active: settings.get_boolean("show-line-numbers")
            });

            showLineNumbersRow.connect("notify::active", () => {
                settings.set_boolean(
                    "show-line-numbers",
                    showLineNumbersRow.get_active()
                );
            });

            group.add(showLineNumbersRow);

            // WRAP TEXT
            const wrapTextRow = new Adw.SwitchRow({
                title: "Wrap text",
                active: settings.get_boolean("wrap-text")
            });

            wrapTextRow.connect("notify::active", () => {
                settings.set_boolean(
                    "wrap-text",
                    wrapTextRow.get_active()
                );
            });

            group.add(wrapTextRow);

            page.add(group);
            prefs.add(page);

            prefs.present();
        }

        set_dirty(dirty) {
            this.isDirty = dirty;
            this.update_title();
        }

        update_title() {
            const name = this.currentFile ? this.currentFile.get_basename() : "Untitled";
            const dirtyMarker = this.isDirty ? " *" : "";
            this.set_title(`Nimble — ${name}${dirtyMarker}`);
        }

        open_file() {
            const chooser = new Gtk.FileChooserNative({
                title: "Open File",
                transient_for: this,
                action: Gtk.FileChooserAction.OPEN,
                accept_label: "Open",
                cancel_label: "Cancel"
            });

            chooser.connect("response", (dialog, response) => {
                if (response !== Gtk.ResponseType.ACCEPT) {
                    dialog.destroy();
                    return;
                }

                const file = dialog.get_file();

                try {
                    const [success, contents] = file.load_contents(null);
                    if (success) {
                        const text = new TextDecoder().decode(contents);
                        this.editor.load_text(text);
                        this.currentFile = file;
                        this.set_dirty(false);
                    }
                } catch (error) {
                    console.error("Failed to open file:", error);
                }

                dialog.destroy();
            });

            chooser.show();
        }

       save_file() {
    if (!this.currentFile) {
        this.save_file_as();
        return;
    }

    try {
        const contents = this.editor.get_text();
        const bytes = new TextEncoder().encode(contents);

        const stream = this.currentFile.replace(
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null
        );

        stream.write_all(bytes, null);
        stream.close(null);

        this.set_dirty(false);

    } catch (error) {
        console.error("Failed to save file:", error);
    }
}

        save_file_as() {
    const dialog = new Gtk.FileDialog({
        title: "Save File"
    });

    dialog.save(this, null, (dialog, result) => {
        try {
            const file = dialog.save_finish(result);

            const contents = this.editor.get_text();

            const bytes = new TextEncoder().encode(contents);

            const stream = file.replace(
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );

            stream.write_all(bytes, null);
            stream.close(null);

            this.currentFile = file;
            this.set_dirty(false);

        } catch (e) {
            console.log("Save cancelled or failed:", e);
        }
    });
}
    });