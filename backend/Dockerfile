# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (better layer caching).
COPY FinTrack.Api/FinTrack.Api.csproj FinTrack.Api/
RUN dotnet restore FinTrack.Api/FinTrack.Api.csproj

# Copy the rest and publish.
COPY . .
RUN dotnet publish FinTrack.Api/FinTrack.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Listen on 8080 inside the container.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FinTrack.Api.dll"]
