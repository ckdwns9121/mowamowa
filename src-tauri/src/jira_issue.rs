use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignedJiraIssuesResult {
    issues: Vec<AssignedJiraIssue>,
    truncated: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignedJiraIssue {
    key: String,
    summary: String,
    status: String,
    status_category: String,
    priority: Option<String>,
    project_key: String,
    project_name: String,
    due_date: Option<String>,
    updated_at: String,
    url: String,
}

#[derive(Debug, Deserialize)]
struct JiraIssueResponse {
    key: String,
    fields: JiraIssueFields,
}

#[derive(Debug, Deserialize)]
struct JiraIssueFields {
    summary: String,
    status: JiraStatus,
    updated: String,
    #[serde(default)]
    priority: Option<JiraNamedValue>,
    #[serde(default)]
    project: Option<JiraProject>,
    #[serde(default, rename = "duedate")]
    due_date: Option<String>,
}

#[derive(Debug, Deserialize)]
struct JiraNamedValue {
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JiraStatus {
    name: String,
    status_category: JiraStatusCategory,
}

#[derive(Debug, Deserialize)]
struct JiraStatusCategory {
    key: String,
}

#[derive(Debug, Deserialize)]
struct JiraProject {
    key: String,
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct JiraSearchRequest<'a> {
    jql: &'a str,
    fields: Vec<&'a str>,
    max_results: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    next_page_token: Option<&'a str>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JiraSearchResponse {
    #[serde(default)]
    issues: Vec<JiraIssueResponse>,
    next_page_token: Option<String>,
}

#[tauri::command]
pub async fn fetch_assigned_jira_issues(
    jira_url: String,
    jira_email: String,
) -> Result<AssignedJiraIssuesResult, String> {
    tauri::async_runtime::spawn_blocking(move || fetch_assigned(jira_url, jira_email))
        .await
        .map_err(|_| "담당 Jira 티켓 조회가 중단되었습니다.".to_string())?
}

fn fetch_assigned(
    jira_url: String,
    jira_email: String,
) -> Result<AssignedJiraIssuesResult, String> {
    let base_url = validate_jira_cloud_url(&jira_url)?;
    if jira_email.trim().is_empty() {
        return Err("Jira 연결 설정에서 계정 이메일을 입력해주세요.".into());
    }
    let token = super::get_secret("jira_api_token")?;
    let search_url = base_url
        .join("rest/api/3/search/jql")
        .map_err(|_| "Jira 검색 URL을 만들지 못했습니다.".to_string())?;
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| "Jira HTTP 클라이언트를 만들지 못했습니다.".to_string())?;
    let mut issues = Vec::new();
    let mut next_page_token: Option<String> = None;
    let mut truncated = false;

    loop {
        let body = JiraSearchRequest {
            jql: "assignee = currentUser() ORDER BY updated DESC",
            fields: vec![
                "summary", "status", "priority", "project", "duedate", "updated",
            ],
            max_results: 100,
            next_page_token: next_page_token.as_deref(),
        };
        let response = client
            .post(search_url.clone())
            .basic_auth(jira_email.trim(), Some(&token))
            .header("Accept", "application/json")
            .json(&body)
            .send()
            .map_err(|_| "Jira에 연결하지 못했습니다.".to_string())?;
        if !response.status().is_success() {
            return Err(jira_status_error(response.status().as_u16()));
        }
        let page: JiraSearchResponse = response
            .json()
            .map_err(|_| "Jira 검색 응답을 읽지 못했습니다.".to_string())?;
        for response in page.issues {
            let Some(project) = response.fields.project else {
                continue;
            };
            let url = base_url
                .join(&format!("browse/{}", response.key))
                .map_err(|_| "Jira 티켓 URL을 만들지 못했습니다.".to_string())?
                .to_string();
            issues.push(AssignedJiraIssue {
                key: response.key,
                summary: response.fields.summary,
                status: response.fields.status.name,
                status_category: response.fields.status.status_category.key,
                priority: response.fields.priority.map(|value| value.name),
                project_key: project.key,
                project_name: project.name,
                due_date: response.fields.due_date,
                updated_at: response.fields.updated,
                url,
            });
        }
        next_page_token = page.next_page_token;
        if next_page_token.is_none() {
            break;
        }
        if issues.len() >= 500 {
            issues.truncate(500);
            truncated = true;
            break;
        }
    }

    Ok(AssignedJiraIssuesResult { issues, truncated })
}

fn jira_status_error(status: u16) -> String {
    match status {
        401 | 403 => "Jira 인증 또는 티켓 조회 권한을 확인해주세요.".into(),
        404 => "Jira 검색 API를 찾지 못했습니다.".into(),
        _ => format!("Jira 티켓 조회에 실패했습니다. ({status})"),
    }
}

pub(crate) fn validate_jira_cloud_url(value: &str) -> Result<reqwest::Url, String> {
    let mut url = reqwest::Url::parse(value.trim())
        .map_err(|_| "Jira 사이트 URL을 확인해주세요.".to_string())?;
    let host = url.host_str().unwrap_or_default().to_ascii_lowercase();
    if url.scheme() != "https" || !(host == "atlassian.net" || host.ends_with(".atlassian.net")) {
        return Err("Jira Cloud의 https://*.atlassian.net URL만 지원합니다.".into());
    }
    url.set_path("/");
    url.set_query(None);
    url.set_fragment(None);
    Ok(url)
}

#[cfg(test)]
mod tests {
    use super::validate_jira_cloud_url;
    #[test]
    fn only_accepts_atlassian_cloud_urls() {
        assert!(validate_jira_cloud_url("https://team.atlassian.net").is_ok());
        assert!(validate_jira_cloud_url("https://example.com").is_err());
        assert!(validate_jira_cloud_url("http://team.atlassian.net").is_err());
    }
}
