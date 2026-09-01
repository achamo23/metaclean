# pinkclean

사진의 EXIF/메타데이터를 브라우저에서 제거하는 정적 웹사이트입니다.

## 기능
- 핑크/화이트 반응형 디자인
- 원본 / 메타데이터 제거 결과 미리보기
- JPG / JPEG / PNG / WebP / GIF / BMP
- HEIC / HEIF 지원 (heic2any 사용)
- 드래그 앤 드롭
- 여러 파일 일괄 처리
- PNG / WebP 다운로드
- 여러 파일은 ZIP으로 다운로드
- 서버 업로드 없이 브라우저에서 처리
- `noindex,nofollow` + robots.txt로 검색엔진 노출 억제

## GitHub Pages
기존 repository의 파일을 아래처럼 교체하세요.

index.html
style.css
script.js
robots.txt

Settings → Pages에서 main / root로 배포하면 됩니다.

## 참고
Canvas 재인코딩 방식이라 결과 이미지의 압축/색상 프로필/애니메이션 특성이 원본과 달라질 수 있습니다.
HEIC 변환 라이브러리는 jsDelivr에서 로드합니다.
