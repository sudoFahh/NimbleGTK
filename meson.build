project('nimble', 'c')

install_data(
  'src/main.js',
  'src/editor.js',
  'src/settings.js',
  'src/window.js',
  install_dir: get_option('datadir') / 'nimble'
)

install_subdir(
  'styles',
  install_dir: get_option('datadir') / 'nimble/styles'
)

install_data(
  'schemas/io.vncl.sudofahh.nimble.gschema.xml',
  install_dir: get_option('datadir') / 'glib-2.0/schemas'
)