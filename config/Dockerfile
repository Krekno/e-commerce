FROM eclipse-temurin:23-jdk
WORKDIR /app
COPY build/libs/*.jar ./
RUN rm -f *-plain.jar && mv *.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
