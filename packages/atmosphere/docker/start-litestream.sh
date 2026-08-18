#!/bin/sh

if [ ! -d "${ATMOSPHERE_TOOL_DIR}" ] ; then
  mkdir -p "$ATMOSPHERE_TOOL_DIR"
fi

# ensure backwards compatibility of renamed env vars
if [ -z "${LITESTREAM_S3_ACCESS_KEY_ID}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ] ; then
  export LITESTREAM_S3_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
fi
if [ -z "${LITESTREAM_S3_SECRET_ACCESS_KEY}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ] ; then
  export LITESTREAM_S3_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
fi
if [ -z "${LITESTREAM_S3_PATH}" ] && [ -n "${AWS_BUCKET_PATH}" ] ; then
  export LITESTREAM_S3_PATH="${AWS_BUCKET_PATH}"
fi
if [ -z "${LITESTREAM_S3_BUCKET}" ] && [ -n "${AWS_BUCKET}" ] ; then
  export LITESTREAM_S3_BUCKET="${AWS_BUCKET}"
fi


use_litestream() {
     [ -z "${ATMOSPHERE_DB}" ] \
  && [ -z "${ATMOSPHERE_DB_JSON}" ] \
  && [ -z "${ATMOSPHERE_DB_JSON_FILE}" ] \
  && [ -z "${DATABASE_URL}" ] \
  && [ -z "${DATABASE_URL_FILE}" ] \
  && [ -z "${ATMOSPHERE_MINIMAL_DBS}" ] \
  && [ -n "${LITESTREAM_S3_BUCKET}" ] \
  && [ -n "${LITESTREAM_S3_ACCESS_KEY_ID}" ] \
  && [ -n "${LITESTREAM_S3_SECRET_ACCESS_KEY}" ]
}

if use_litestream ; then

  # set default bucket path if not provided
  : "${LITESTREAM_S3_PATH:=atmosphere}"

  # enable age encryption in Litestream config if indicated
  LITESTREAM_CONFIG_PATH='/etc/litestream.yml'

  if [ -n "${LITESTREAM_AGE_PUBLIC_KEY}" ] \
  && [ -n "${LITESTREAM_AGE_SECRET_KEY}" ] \
  && ! dasel --file "${LITESTREAM_CONFIG_PATH}" --read yaml 'dbs.first().replicas.first().age' > /dev/null 2>&1 ; then
    # shellcheck disable=SC2016
    dasel put --file "${LITESTREAM_CONFIG_PATH}" \
              --read yaml \
              --type json \
              --value '{ "identities": [ "${LITESTREAM_AGE_SECRET_KEY}" ], "recipients": [ "${LITESTREAM_AGE_PUBLIC_KEY}" ] }' \
              --selector 'dbs.first().replicas.first().age'
  fi

  # remove any possible local DB leftovers
  if [ -f "${ATMOSPHERE_TOOL_DIR}atmosphere.db" ] ; then
    rm "${ATMOSPHERE_TOOL_DIR}atmosphere.db"
    rm -f "${ATMOSPHERE_TOOL_DIR}atmosphere.db-shm"
    rm -f "${ATMOSPHERE_TOOL_DIR}atmosphere.db-wal"
  fi

  # restore DB from Litestream replica
  litestream restore "${ATMOSPHERE_TOOL_DIR}atmosphere.db"

  # create empty DB file if no Litestream replica exists
  if [ ! -f "${ATMOSPHERE_TOOL_DIR}atmosphere.db" ] ; then
    touch "${ATMOSPHERE_TOOL_DIR}atmosphere.db"
  fi

  # start Litestream replication
  litestream replicate &
fi

# start Atmosphere
node docker/main.js
