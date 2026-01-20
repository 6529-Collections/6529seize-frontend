set -e
BRANCH=$1
if [ $# -eq 0 ]
  then
    BRANCH='main'
fi
curl -H 'Accept: application/vnd.github.v3.raw' "https://api.github.com/repos/6529-Collections/6529seize-backend/contents/src/api-serverless/openapi.yaml?ref=${BRANCH}" > openapi.yaml