import Gtk from "gi://Gtk?version=4.0";
import GtkSource from "gi://GtkSource?version=5";

import { settings } from "./settings.js";

export class Editor {

    constructor() {

        this.buffer = new GtkSource.Buffer();
        this.ignoreBufferChanges = false;

        this.view = new GtkSource.View({
            buffer: this.buffer,
            monospace: true,
            hexpand: true,
            vexpand: true,
            show_line_numbers: settings.get_boolean("show-line-numbers"),
            wrap_mode: settings.get_boolean("wrap-text")
                ? Gtk.WrapMode.WORD
                : Gtk.WrapMode.NONE
        });

        this.cssProvider = new Gtk.CssProvider();
        this.minFontSize = 6;
        this.maxFontSize = 72;
        this.zoomStep = 1;

        this.setup_language();

        this.apply_font();

        this.setup_settings_reactivity();
    }

    setup_language() {

        const lm = GtkSource.LanguageManager.get_default();

        const markdown = lm.get_language("markdown");

        if (markdown)
            this.buffer.set_language(markdown);
    }

    apply_font() {

        const font = settings.get_string("font-family");

        const size = settings.get_int("font-size");
        const lineHeight = settings.get_double("line-height");

        const css = `
            textview {
                font-family: "${font}";
                font-size: ${size}px;
                line-height: ${lineHeight};
            }
        `;

        this.cssProvider.load_from_string(css);

        Gtk.StyleContext.add_provider_for_display(
            this.view.get_display(),
            this.cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );

        this.view.get_style_context().add_provider(
            this.cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
    }

    setup_settings_reactivity() {

        settings.connect("changed::font-family", () => {
            this.apply_font();
        });

        settings.connect("changed::font-size", () => {
            this.apply_font();
        });

        settings.connect("changed::line-height", () => {
            this.apply_font();
        });

        settings.connect("changed::show-line-numbers", () => {

            this.view.set_show_line_numbers(
                settings.get_boolean("show-line-numbers")
            );
        });

        settings.connect("changed::wrap-text", () => {

            this.view.set_wrap_mode(
                settings.get_boolean("wrap-text")
                    ? Gtk.WrapMode.WORD
                    : Gtk.WrapMode.NONE
            );
        });
    }

    zoomIn() {
        const currentSize = settings.get_int("font-size");
        const nextSize = Math.min(this.maxFontSize, currentSize + this.zoomStep);
        settings.set_int("font-size", nextSize);
    }

    zoomOut() {
        const currentSize = settings.get_int("font-size");
        const nextSize = Math.max(this.minFontSize, currentSize - this.zoomStep);
        settings.set_int("font-size", nextSize);
    }

    load_text(text) {

        this.ignoreBufferChanges = true;
        this.buffer.set_text(text, -1);
        this.ignoreBufferChanges = false;

        if (typeof this.buffer.set_modified === "function") {
            this.buffer.set_modified(false);
        }
    }

    get_text() {

        return this.buffer.get_text(
            this.buffer.get_start_iter(),
            this.buffer.get_end_iter(),
            false
        );
    }
}
