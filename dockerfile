# (1) Node.js 18 사용
FROM node:18-alpine

# (2) 작업 디렉토리 생성
WORKDIR /app

# (3) package.json, package-lock.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# (4) 소스 전체 복사 및 빌드
COPY . .
RUN npm run build

# (5) 컨테이너 기동 시 포트 3000 사용
EXPOSE 3000

# (6) 앱 실행 명령
CMD ["npm", "start"]
