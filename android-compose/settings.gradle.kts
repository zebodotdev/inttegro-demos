pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "InttegroComposeDemo"
include(":app")
include(":inttegro")
project(":inttegro").projectDir = file("../../sdks/mobile/android/payments")
