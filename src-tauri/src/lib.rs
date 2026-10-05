use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Profile {
    id: String,
    display_name: String,
    age: u16,
    height_cm: f64,
    weight_kg: f64,
    created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProfileInput {
    display_name: String,
    age: u16,
    height_cm: f64,
    weight_kg: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScanInput {
    balance: f64,
    mobility: f64,
    endurance: f64,
    explosiveness: f64,
    rotation_limit: f64,
    impact_limit: f64,
    discomfort_level: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BodyModel {
    version: u32,
    confidence: f64,
    balance: f64,
    mobility: f64,
    endurance: f64,
    explosiveness: f64,
    rotation_limit: f64,
    impact_limit: f64,
    safety_state: String,
    provenance: Vec<String>,
    updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StyleDna {
    name: String,
    seed: String,
    range: f64,
    mobility: f64,
    rotation: f64,
    impact: f64,
    leverage: f64,
    tempo: f64,
    balance_dependency: f64,
    footwork_complexity: f64,
    restrictions: Vec<String>,
    reasons: Vec<String>,
    version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Drill {
    id: String,
    name: String,
    description: String,
    focus: String,
    difficulty: f64,
    duration_seconds: u32,
    reps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Curriculum {
    readiness: f64,
    status: String,
    drills: Vec<Drill>,
    generated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionRecord {
    id: String,
    drill_id: String,
    drill_name: String,
    score: f64,
    reps: u32,
    completed_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProgressSummary {
    sessions: usize,
    total_reps: u32,
    average_score: f64,
    mastery: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SomaState {
    schema_version: u32,
    profile: Option<Profile>,
    latest_scan: Option<ScanInput>,
    body_model: Option<BodyModel>,
    style: Option<StyleDna>,
    curriculum: Option<Curriculum>,
    sessions: Vec<SessionRecord>,
    style_registry: Vec<String>,
}

impl Default for SomaState {
    fn default() -> Self {
        Self {
            schema_version: 1,
            profile: None,
            latest_scan: None,
            body_model: None,
            style: None,
            curriculum: None,
            sessions: Vec::new(),
            style_registry: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Dashboard {
    state: SomaState,
    progress: ProgressSummary,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn clamp01(value: f64) -> f64 {
    value.clamp(0.0, 1.0)
}

fn percent(value: f64) -> f64 {
    clamp01(value / 100.0)
}

fn state_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Unable to locate Soma data directory: {e}"))?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Unable to create Soma data directory: {e}"))?;
    Ok(dir.join("soma-state.json"))
}

fn load_state(app: &AppHandle) -> SomaState {
    let Ok(path) = state_path(app) else {
        return SomaState::default();
    };
    let Ok(raw) = fs::read_to_string(path) else {
        return SomaState::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

fn save_state(app: &AppHandle, state: &SomaState) -> Result<(), String> {
    let path = state_path(app)?;
    let raw = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Unable to serialize Soma state: {e}"))?;
    fs::write(path, raw).map_err(|e| format!("Unable to save Soma state: {e}"))
}

fn progress(state: &SomaState) -> ProgressSummary {
    let sessions = state.sessions.len();
    let total_reps = state.sessions.iter().map(|s| s.reps).sum();
    let average_score = if sessions == 0 {
        0.0
    } else {
        state.sessions.iter().map(|s| s.score).sum::<f64>() / sessions as f64
    };
    let mastery = clamp01((sessions as f64 / 20.0) * 0.55 + average_score * 0.45);

    ProgressSummary {
        sessions,
        total_reps,
        average_score,
        mastery,
    }
}

fn build_body_model(scan: &ScanInput, previous_version: u32) -> BodyModel {
    let discomfort = scan.discomfort_level.clamp(0.0, 10.0);
    let safety_state = if discomfort >= 7.0 {
        "PAUSED"
    } else if discomfort >= 4.0 {
        "REDUCED"
    } else {
        "READY"
    }
    .to_string();

    BodyModel {
        version: previous_version + 1,
        confidence: 0.82,
        balance: percent(scan.balance),
        mobility: percent(scan.mobility),
        endurance: percent(scan.endurance),
        explosiveness: percent(scan.explosiveness),
        rotation_limit: percent(scan.rotation_limit),
        impact_limit: percent(scan.impact_limit),
        safety_state,
        provenance: vec![
            "User-declared movement scan".to_string(),
            "User-declared rotation and impact limits".to_string(),
            "No medical inference".to_string(),
        ],
        updated_at: now_ms(),
    }
}

fn seed_for(profile: &Profile, body: &BodyModel) -> String {
    let canonical = format!(
        "{}|{}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{:.3}|{}",
        profile.age,
        profile.id,
        body.balance,
        body.mobility,
        body.endurance,
        body.explosiveness,
        body.rotation_limit,
        body.impact_limit,
        body.version
    );
    let digest = Sha256::digest(canonical.as_bytes());
    digest.iter().map(|b| format!("{b:02x}")).collect()
}

fn style_name(seed: &str, existing: &HashSet<String>) -> String {
    const ONSETS: &[&str] = &[
        "V", "K", "Z", "R", "T", "S", "N", "L", "D", "M", "F", "Vr", "Ka", "Xe", "Th",
    ];
    const VOWELS: &[&str] = &["ae", "ai", "eo", "ia", "o", "u", "ei", "a"];
    const CODAS: &[&str] = &["n", "r", "x", "k", "th", "v", "s", "l", "m"];

    let bytes = seed.as_bytes();

    for attempt in 0..256usize {
        let offset = attempt * 7;
        let a = bytes[offset % bytes.len()] as usize;
        let b = bytes[(offset + 5) % bytes.len()] as usize;
        let c = bytes[(offset + 11) % bytes.len()] as usize;
        let d = bytes[(offset + 17) % bytes.len()] as usize;
        let e = bytes[(offset + 23) % bytes.len()] as usize;

        let raw = format!(
            "{}{}{}{}{}",
            ONSETS[a % ONSETS.len()],
            VOWELS[b % VOWELS.len()],
            CODAS[c % CODAS.len()],
            VOWELS[d % VOWELS.len()],
            CODAS[e % CODAS.len()]
        );

        let normalized = raw.to_lowercase();
        if !existing.contains(&normalized) {
            return raw;
        }
    }

    format!("Soma{}", &seed[..6])
}

fn build_style(profile: &Profile, body: &BodyModel, registry: &[String]) -> StyleDna {
    let seed = seed_for(profile, body);
    let existing: HashSet<String> = registry.iter().map(|s| s.to_lowercase()).collect();
    let name = style_name(&seed, &existing);

    let rotation = clamp01(body.rotation_limit * 0.85);
    let impact = clamp01(body.impact_limit * 0.80);
    let mobility = body.mobility.min(body.rotation_limit);
    let range = clamp01(0.42 + body.endurance * 0.28 + body.balance * 0.10);
    let leverage = clamp01(0.42 + body.balance * 0.35 + (1.0 - impact) * 0.12);
    let tempo = clamp01(0.28 + body.endurance * 0.38 + body.explosiveness * 0.20);
    let balance_dependency = clamp01(0.18 + body.balance * 0.55);
    let footwork_complexity = clamp01(body.balance.min(mobility) * 0.72);

    let mut restrictions = Vec::new();
    if body.rotation_limit < 0.45 {
        restrictions.push("Keep rotational demand low".to_string());
    }
    if body.impact_limit < 0.45 {
        restrictions.push("Keep impact demand low".to_string());
    }
    if body.balance < 0.45 {
        restrictions.push("Prefer stable base positions and simple steps".to_string());
    }
    if body.safety_state == "REDUCED" {
        restrictions.push("Current session intensity reduced by reported discomfort".to_string());
    }
    if body.safety_state == "PAUSED" {
        restrictions.push("Active training paused because reported discomfort is high".to_string());
    }

    StyleDna {
        name,
        seed,
        range,
        mobility,
        rotation,
        impact,
        leverage,
        tempo,
        balance_dependency,
        footwork_complexity,
        restrictions,
        reasons: vec![
            format!("Rotation capped at {:.0}% from your declared limit", rotation * 100.0),
            format!("Impact capped at {:.0}% from your declared limit", impact * 100.0),
            format!("Tempo reflects endurance ({:.0}%) and explosiveness ({:.0}%)", body.endurance * 100.0, body.explosiveness * 100.0),
            "Safety constraints override style preference".to_string(),
        ],
        version: body.version,
    }
}

fn build_curriculum(body: &BodyModel, style: &StyleDna) -> Curriculum {
    let readiness = clamp01(
        body.balance * 0.24
            + body.mobility * 0.22
            + body.endurance * 0.30
            + body.explosiveness * 0.10
            + body.confidence * 0.14,
    );

    if body.safety_state == "PAUSED" {
        return Curriculum {
            readiness: 0.0,
            status: "PAUSED".to_string(),
            drills: Vec::new(),
            generated_at: now_ms(),
        };
    }

    let modifier = if body.safety_state == "REDUCED" { 0.55 } else { 1.0 };
    let difficulty = clamp01((0.25 + readiness * 0.55) * modifier);

    let drills = vec![
        Drill {
            id: "base-align".to_string(),
            name: "Base Alignment".to_string(),
            description: "Set a comfortable stance, maintain alignment, and reset under control.".to_string(),
            focus: "stability".to_string(),
            difficulty,
            duration_seconds: 90,
            reps: 8,
        },
        Drill {
            id: "angle-step".to_string(),
            name: "Controlled Angle Step".to_string(),
            description: "Create a small angle with simple footwork, then return to a stable base.".to_string(),
            focus: "footwork".to_string(),
            difficulty: clamp01(difficulty + style.footwork_complexity * 0.12),
            duration_seconds: 120,
            reps: 10,
        },
        Drill {
            id: "range-flow".to_string(),
            name: "Range Flow".to_string(),
            description: "Move in and out of your preferred range without impact, keeping motion smooth.".to_string(),
            focus: "range".to_string(),
            difficulty: clamp01(difficulty + style.tempo * 0.10),
            duration_seconds: 120,
            reps: 12,
        },
        Drill {
            id: "balance-exit".to_string(),
            name: "Balance Exit".to_string(),
            description: "Finish each sequence balanced, then recover to a neutral stance.".to_string(),
            focus: "recovery".to_string(),
            difficulty: clamp01(difficulty + style.balance_dependency * 0.08),
            duration_seconds: 90,
            reps: 8,
        },
    ];

    Curriculum {
        readiness,
        status: body.safety_state.clone(),
        drills,
        generated_at: now_ms(),
    }
}

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

#[tauri::command]
fn get_dashboard(state: State<'_, Mutex<SomaState>>) -> Result<Dashboard, String> {
    let state = state.lock().map_err(|_| "Soma state lock failed".to_string())?;
    Ok(Dashboard {
        state: state.clone(),
        progress: progress(&state),
    })
}

#[tauri::command]
fn create_profile(
    app: AppHandle,
    state: State<'_, Mutex<SomaState>>,
    input: ProfileInput,
) -> Result<Dashboard, String> {
    if input.display_name.trim().is_empty() {
        return Err("Display name is required".to_string());
    }
    if !(10..=120).contains(&input.age) {
        return Err("Age must be between 10 and 120".to_string());
    }
    if !(80.0..=260.0).contains(&input.height_cm) {
        return Err("Height must be between 80 and 260 cm".to_string());
    }
    if !(20.0..=350.0).contains(&input.weight_kg) {
        return Err("Weight must be between 20 and 350 kg".to_string());
    }

    let mut guard = state.lock().map_err(|_| "Soma state lock failed".to_string())?;
    guard.profile = Some(Profile {
        id: format!("usr_{}", now_ms()),
        display_name: input.display_name.trim().to_string(),
        age: input.age,
        height_cm: input.height_cm,
        weight_kg: input.weight_kg,
        created_at: now_ms(),
    });
    guard.latest_scan = None;
    guard.body_model = None;
    guard.style = None;
    guard.curriculum = None;
    guard.sessions.clear();

    let snapshot = guard.clone();
    save_state(&app, &snapshot)?;
    Ok(Dashboard {
        progress: progress(&snapshot),
        state: snapshot,
    })
}

#[tauri::command]
fn submit_scan(
    app: AppHandle,
    state: State<'_, Mutex<SomaState>>,
    input: ScanInput,
) -> Result<Dashboard, String> {
    let mut guard = state.lock().map_err(|_| "Soma state lock failed".to_string())?;
    let profile = guard
        .profile
        .clone()
        .ok_or_else(|| "Create a profile before scanning".to_string())?;

    let previous_version = guard.body_model.as_ref().map(|m| m.version).unwrap_or(0);
    let body = build_body_model(&input, previous_version);
    let style = build_style(&profile, &body, &guard.style_registry);
    let curriculum = build_curriculum(&body, &style);

    if !guard
        .style_registry
        .iter()
        .any(|name| name.eq_ignore_ascii_case(&style.name))
    {
        guard.style_registry.push(style.name.clone());
    }

    guard.latest_scan = Some(input);
    guard.body_model = Some(body);
    guard.style = Some(style);
    guard.curriculum = Some(curriculum);

    let snapshot = guard.clone();
    save_state(&app, &snapshot)?;
    Ok(Dashboard {
        progress: progress(&snapshot),
        state: snapshot,
    })
}

#[tauri::command]
fn complete_session(
    app: AppHandle,
    state: State<'_, Mutex<SomaState>>,
    drill_id: String,
    score: f64,
    reps: u32,
) -> Result<Dashboard, String> {
    let mut guard = state.lock().map_err(|_| "Soma state lock failed".to_string())?;

    let body = guard
        .body_model
        .as_ref()
        .ok_or_else(|| "A body model is required before training".to_string())?;

    if body.safety_state == "PAUSED" {
        return Err("Training is paused because reported discomfort is high".to_string());
    }

    let curriculum = guard
        .curriculum
        .as_ref()
        .ok_or_else(|| "Generate a curriculum before training".to_string())?;

    let drill = curriculum
        .drills
        .iter()
        .find(|d| d.id == drill_id)
        .cloned()
        .ok_or_else(|| "Unknown drill".to_string())?;

    guard.sessions.push(SessionRecord {
        id: format!("ses_{}", now_ms()),
        drill_id: drill.id,
        drill_name: drill.name,
        score: clamp01(score),
        reps: reps.min(500),
        completed_at: now_ms(),
    });

    let snapshot = guard.clone();
    save_state(&app, &snapshot)?;
    Ok(Dashboard {
        progress: progress(&snapshot),
        state: snapshot,
    })
}

#[tauri::command]
fn reset_soma(app: AppHandle, state: State<'_, Mutex<SomaState>>) -> Result<Dashboard, String> {
    let mut guard = state.lock().map_err(|_| "Soma state lock failed".to_string())?;
    *guard = SomaState::default();
    let snapshot = guard.clone();
    save_state(&app, &snapshot)?;
    Ok(Dashboard {
        progress: progress(&snapshot),
        state: snapshot,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .setup(|app| {
            let state = load_state(&app.handle());
            app.manage(Mutex::new(state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            runtime_platform,
            get_dashboard,
            create_profile,
            submit_scan,
            complete_session,
            reset_soma
        ]);

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .run(tauri::generate_context!())
        .expect("error while running Soma");
}


#[cfg(test)]
mod tests {
    use super::*;

    fn profile() -> Profile {
        Profile {
            id: "test-user".to_string(),
            display_name: "Test".to_string(),
            age: 30,
            height_cm: 175.0,
            weight_kg: 75.0,
            created_at: 1,
        }
    }

    #[test]
    fn style_never_exceeds_declared_rotation_or_impact_limits() {
        let scan = ScanInput {
            balance: 75.0,
            mobility: 85.0,
            endurance: 70.0,
            explosiveness: 80.0,
            rotation_limit: 30.0,
            impact_limit: 25.0,
            discomfort_level: 0.0,
        };
        let body = build_body_model(&scan, 0);
        let style = build_style(&profile(), &body, &[]);
        assert!(style.rotation <= body.rotation_limit);
        assert!(style.impact <= body.impact_limit);
    }

    #[test]
    fn high_reported_discomfort_pauses_curriculum() {
        let scan = ScanInput {
            balance: 80.0,
            mobility: 80.0,
            endurance: 80.0,
            explosiveness: 80.0,
            rotation_limit: 80.0,
            impact_limit: 80.0,
            discomfort_level: 8.0,
        };
        let body = build_body_model(&scan, 0);
        let style = build_style(&profile(), &body, &[]);
        let curriculum = build_curriculum(&body, &style);
        assert_eq!(body.safety_state, "PAUSED");
        assert!(curriculum.drills.is_empty());
    }

    #[test]
    fn generated_names_are_single_word_and_collision_aware() {
        let scan = ScanInput {
            balance: 60.0,
            mobility: 60.0,
            endurance: 60.0,
            explosiveness: 50.0,
            rotation_limit: 70.0,
            impact_limit: 60.0,
            discomfort_level: 0.0,
        };
        let body = build_body_model(&scan, 0);
        let first = build_style(&profile(), &body, &[]);
        let second = build_style(&profile(), &body, &[first.name.clone()]);
        assert!(!first.name.contains(char::is_whitespace));
        assert_ne!(first.name.to_lowercase(), second.name.to_lowercase());
    }
}
