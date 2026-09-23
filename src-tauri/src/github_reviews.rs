use serde::{Deserialize, Serialize};
use std::{path::PathBuf, process::Command};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewRequest {
    number: u64,
    title: String,
    url: String,
    updated_at: String,
    repository: Repository,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Repository {
    name_with_owner: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReviewRequests {
    account: String,
    items: Vec<ReviewRequest>,
    possibly_truncated: bool,
}

#[tauri::command]
pub async fn fetch_github_review_requests() -> Result<ReviewRequests, String> {
    tauri::async_runtime::spawn_blocking(fetch)
        .await
        .map_err(|_| "PR 리뷰 조회가 중단됐습니다.".to_string())?
}

fn fetch() -> Result<ReviewRequests, String> {
    let gh = ["/opt/homebrew/bin/gh", "/usr/local/bin/gh", "/usr/bin/gh"]
        .into_iter().map(PathBuf::from).find(|path| path.is_file())
        .unwrap_or_else(|| PathBuf::from("gh"));
    let run = |args: &[&str]| -> Result<Vec<u8>, String> {
        let output = Command::new(&gh).args(args).output()
            .map_err(|_| "GitHub CLI가 필요합니다. 터미널에서 gh auth login으로 연결해주세요.".to_string())?;
        if !output.status.success() {
            return Err("GitHub 조회에 실패했습니다. 네트워크와 gh auth status의 활성 계정을 확인해주세요.".into());
        }
        Ok(output.stdout)
    };
    let account = String::from_utf8(run(&["api", "user", "--jq", ".login"])? )
        .map_err(|_| "GitHub 계정 정보를 읽지 못했습니다.".to_string())?.trim().to_string();
    // Query the signed-in user's review queue directly, without AI sessions or local repositories.
    let items: Vec<ReviewRequest> = serde_json::from_slice(&run(&[
        "search", "prs", "--review-requested", "@me", "--state", "open",
        "--limit", "100", "--sort", "updated", "--order", "asc",
        "--json", "number,title,url,updatedAt,repository",
    ])?).map_err(|_| "GitHub 리뷰 목록을 읽지 못했습니다.".to_string())?;
    Ok(ReviewRequests { account, possibly_truncated: items.len() == 100, items })
}

#[cfg(test)]
mod tests {
    use super::ReviewRequest;

    #[test]
    fn reads_review_results_without_session_or_branch_metadata() {
        let items: Vec<ReviewRequest> = serde_json::from_str(r#"[{"number":42,"title":"Fix","url":"https://github.com/org/repo/pull/42","updatedAt":"2026-09-23T00:00:00Z","repository":{"nameWithOwner":"org/repo"}}]"#).unwrap();
        assert_eq!(items[0].repository.name_with_owner, "org/repo");
        assert_eq!(items[0].number, 42);
        assert!(serde_json::from_str::<Vec<ReviewRequest>>("{\"message\":\"error\"}").is_err());
    }
}
