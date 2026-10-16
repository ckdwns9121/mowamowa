// public/ 파일 경로에 basePath를 붙인다. <img src>, CSS url, Rive src 등 Next가 자동으로 안 고쳐주는 곳에 쓴다.
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
