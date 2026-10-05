#[tauri::command]
fn runtime_platform() -> &'static str {
    #[cfg(target_os = "android")]
    {
        return "android";
    }

    #[cfg(target_os = "ios")]
    {
        return "ios";
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        "desktop"
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![runtime_platform]);

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .run(tauri::generate_context!())
        .expect("error while running Soma");
}
