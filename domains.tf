# Your existing Cloud Run service
resource "google_cloud_run_v2_service" "logmystandup" {
  name     = "logmystandup"
  location = "us-central1"
  
  template {
    containers {
      image = "your-image"  # gcr.io/standup-tracker-2026/logmystandup
    }
  }
}

# All domain mappings in one resource
resource "google_cloud_run_domain_mapping" "domains" {
  for_each = toset([
    "logmystandup.com",
    "www.logmystandup.com", 
    "test.logmystandup.com"
  ])

  location = "us-central1"
  name     = each.value  # Domain name itself
  
  spec {
    route_name = google_cloud_run_v2_service.logmystandup.name
  }
  
  depends_on = [google_cloud_run_v2_service.logmystandup]
}
