# MetaClean

브라우저에서 이미지 메타데이터를 제거하는 정적 웹사이트입니다.

## 기능
- JPG / JPEG / PNG / WebP / GIF / BMP
- 드래그 앤 드롭
- 여러 파일 일괄 처리
- Canvas 재인코딩으로 EXIF/메타데이터 제거
- PNG / WebP 결과 다운로드
- 여러 파일은 ZIP으로 다운로드
- 서버 업로드 없음

## GitHub Pages 배포
1. GitHub에서 새 repository를 만듭니다.
2. `index.html`, `style.css`, `script.js`를 repository 루트에 업로드합니다.
3. Settings → Pages → Deploy from a branch → `main` / `/(root)`를 선택합니다.
4. 저장하면 GitHub Pages 주소가 생성됩니다.

## 주의
이 방식은 브라우저가 이미지를 디코딩한 뒤 Canvas로 다시 인코딩합니다. 따라서 결과물의 압축률, 색상 프로필, 애니메이션 등의 특성이 원본과 달라질 수 있습니다.
HEIC/HEIF는 일반 브라우저에서 안정적인 디코딩이 보장되지 않아 기본 지원 대상에서 제외했습니다.
