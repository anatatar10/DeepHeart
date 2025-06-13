# Build Angular app
FROM node:20 as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Serve using nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/* /usr/share/nginx/html/
