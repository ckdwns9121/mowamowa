import { Notch } from "./Notch";
import { PetPicker } from "./PetPicker";
import { Portrait } from "./Portrait";

const REPO = "https://github.com/ckdwns9121/mowamowa";

const STEPS = [
  { pet: "chiikawa", tone: "pink", title: "모으기", body: "노치에 마우스를 올려 할 일을 적고, 담당 Jira 티켓과 나에게 요청된 PR 리뷰를 확인해요." },
  { pet: "hachiware", tone: "sky", title: "집중하기", body: "한 가지 일을 시작하면 노치에 타이머가 보이고, 바탕화면의 펫이 곁을 지켜요." },
  { pet: "usagi", tone: "butter", title: "돌아보기", body: "달력에서 날짜별 집중 시간과 완료한 일을 살펴봐요." },
];

const SHOTS = [
  { img: "notch-tasks", title: "노치 작업 공간", body: "마우스를 올리면 열리고, 벗어나면 닫혀요. 오늘 할 일과 어제 남은 일만 보여주고, 지난 할 일은 한 번 눌러서 펼쳐요." },
  { img: "notch-calendar", title: "한 달의 집중 기록", body: "집중하거나 완료한 날에 점이 찍혀요. 날짜를 누르면 그날 한 일이 보여요." },
  { img: "notch-jira", title: "내 Jira 티켓", body: "티켓 번호 옆 작은 뱃지로 할 일과 진행 중을 구분해요. 완료 티켓은 기본으로 숨겨요." },
  { img: "notch-reviews", title: "쌓인 PR 리뷰", body: "나에게 리뷰가 요청된 열린 PR을 모아봐요. 누르면 GitHub에서 바로 열려요." },
];

export default function Page() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <Notch />
        <div className="hero-copy">
          <h1 id="hero-title">할 일은 맥북 노치에,<br />집중 친구는 바탕화면에.</h1>
          <p>모와모와는 맥북 카메라 노치에 사는 작은 업무 짝꿍이에요. 노치에 마우스를 올리면 할 일·Jira 티켓·PR 리뷰가 펼쳐지고, 집중할 땐 접힌 노치 옆에 펫과 타이머가 보여요.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={`${REPO}/releases/latest`}>DMG 다운로드</a>
            <a className="btn" href="#install">설치 방법</a>
          </div>
        </div>
        <div className="hero-cast" aria-hidden="true">
          <div className="cast cast-1"><span className="bubble">노치에 마우스를 올려 봐!</span><Portrait id="chiikawa" size={190} /></div>
          <div className="cast cast-2"><Portrait id="hachiware" size={200} /></div>
          <div className="cast cast-3"><span className="bubble">야하!</span><Portrait id="usagi" size={230} /></div>
          <div className="cast cast-4"><Portrait id="momonga" size={180} /></div>
        </div>
        <p className="hero-meta">macOS 13 이상 · 노치가 없는 Mac에서는 화면 위쪽에 같은 모양의 알약이 떠요</p>
      </section>

      <section className="section steps" aria-labelledby="steps-title">
        <h2 id="steps-title">이렇게 함께해요</h2>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title} className={`sticker tone-${s.tone}`}>
              <span className="step-no">{i + 1}</span>
              <Portrait id={s.pet} size={96} className="step-pet" />
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band band-sky" aria-labelledby="tour-title">
        <div className="section tour">
          <h2 id="tour-title">둘러보기</h2>
          <div className="tour-grid">
            {SHOTS.map((s, i) => (
              <figure key={s.img} className={`polaroid ${i % 2 ? "tilt-r" : "tilt-l"}`}>
                <span className="tape" />
                <div className="panel" style={{ backgroundImage: `url(/shots/${s.img}.png)` }} role="img" aria-label={s.title} />
                <figcaption>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <figure className="sticker sword">
            <img src="/shots/rakko-sword.png" alt="칼을 뽑아 두 번 휘두르는 랏코의 연속 동작" width={1280} height={256} />
            <figcaption>가만히 두면 랏코가 칼을 뽑아 두 번 휘둘러요. 클릭하면 점프와 빠른 5회전, 착지 이펙트!</figcaption>
          </figure>
        </div>
      </section>

      <section className="section pets" aria-labelledby="pets-title">
        <h2 id="pets-title">오늘 함께할 친구</h2>
        <p className="lead">17가지 펫 중 마음에 드는 친구를 고르세요. 바탕화면에 캐릭터만 떠 있고, 끌어서 원하는 곳에 둘 수 있어요.</p>
        <PetPicker />
      </section>

      <section className="band band-pink" id="install" aria-labelledby="install-title">
        <div className="section install">
          <h2 id="install-title">설치</h2>
          <ol className="install-steps">
            <li><a href={`${REPO}/releases/latest`}>최신 릴리스</a>에서 <code>.dmg</code>를 받아요. Apple Silicon·Intel 공용이에요.</li>
            <li>DMG를 열고 <code>MowaMowa.app</code>을 응용 프로그램 폴더로 끌어다 놓아요.</li>
            <li>처음 열 때 "확인할 수 없는 개발자" 경고가 뜨면, 시스템 설정 → 개인정보 보호 및 보안에서 <strong>그래도 열기</strong>를 눌러요. Apple 개발자 서명이 없는 팬 프로젝트라 그래요.</li>
          </ol>
          <details className="sticker install-source">
            <summary>소스에서 직접 빌드하기</summary>
            <p>macOS 13 이상, Bun 1.3.6, Rust stable, Xcode Command Line Tools가 필요해요.</p>
            <pre><code>{`git clone ${REPO}.git
cd mowamowa
bun install --frozen-lockfile
bun run bundle:mac
open src-tauri/target/release/bundle/dmg`}</code></pre>
          </details>
          <h3 className="install-sub">처음 실행하면</h3>
          <ul className="install-notes">
            <li>할 일·펫·타이머는 외부 계정 없이 바로 쓸 수 있어요.</li>
            <li>Jira 탭에서 회사 Atlassian 주소, 이메일, API 토큰을 입력하면 내 티켓이 보여요.</li>
            <li>PR 리뷰는 GitHub CLI로 <code>gh auth login</code>한 뒤 연결 버튼을 누르면 돼요.</li>
            <li>할 일과 집중 기록은 이 Mac의 SQLite에만 저장돼요. Jira 토큰은 macOS 키체인에 보관해요.</li>
          </ul>
        </div>
      </section>

      <footer>
        <Portrait id="kurimanju" size={72} />
        <p>치이카와 캐릭터를 사용하는 비공식 팬 프로젝트이며, 원작자나 권리자와 제휴한 공식 앱이 아니에요. 캐릭터와 관련 명칭·그림의 권리는 각 권리자에게 있어요.</p>
        <p>
          <a href={REPO}>GitHub</a> · <a href={`${REPO}/issues`}>버그와 제안 남기기</a>
        </p>
      </footer>
    </main>
  );
}
