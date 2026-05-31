FROM eclipse-temurin:23-jdk AS build
WORKDIR /app
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon
COPY src ./src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:23-jre
WORKDIR /app
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
