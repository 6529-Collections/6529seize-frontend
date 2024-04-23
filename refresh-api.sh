set -e
BRANCH=$1
if [ $# -eq 0 ]
  then
    BRANCH='main'
fi
curl https://raw.githubusercontent.com/6529-Collections/6529seize-backend/${BRANCH}/src/api-serverless/openapi.yaml > openapi.yaml