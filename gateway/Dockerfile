FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

COPY . .

WORKDIR /app/gateway
RUN sed -i 's/\r$//' ./mvnw && chmod +x ./mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /app/gateway/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]