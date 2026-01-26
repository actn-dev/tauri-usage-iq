#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
#[cfg(target_os = "windows")]
use windows::Win32::System::SystemInformation::GetTickCount;

/// Get system idle time in seconds
pub fn get_system_idle_seconds() -> u64 {
    #[cfg(target_os = "windows")]
    {
        get_windows_idle_seconds()
    }
    
    #[cfg(target_os = "macos")]
    {
        get_macos_idle_seconds()
    }
    
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        0 // Default for unsupported platforms
    }
}

#[cfg(target_os = "windows")]
fn get_windows_idle_seconds() -> u64 {
    unsafe {
        let mut last_input = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        
        if GetLastInputInfo(&mut last_input).is_ok() {
            let tick_count = GetTickCount();
            let idle_ms = tick_count - last_input.dwTime;
            (idle_ms / 1000) as u64
        } else {
            0
        }
    }
}

#[cfg(target_os = "macos")]
fn get_macos_idle_seconds() -> u64 {
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
    use core_graphics::event::CGEventType;
    
    let idle_seconds = CGEventSource::seconds_since_last_event_type(
        CGEventSourceStateID::CombinedSessionState,
        CGEventType::Null,
    );
    
    idle_seconds as u64
}

/// Check if system is currently idle based on threshold
pub fn is_system_idle(threshold_seconds: u64) -> bool {
    get_system_idle_seconds() >= threshold_seconds
}
