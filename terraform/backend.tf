terraform {
  backend "s3" {
    bucket         = "shopitry-terraform-state-bucket"
    key            = "shopitry/prod/terraform.tfstate"
    region         = "ap-south-1"
    use_lockfile   = true
  }
}