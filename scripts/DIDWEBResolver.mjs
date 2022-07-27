import fetch from 'cross-fetch';

const DOC_FILE = '/did.json'
const DOC_PATH = '/.well-known/did.json'

const ID_CHAR = '[a-zA-Z0-9_.%-]'
const METHOD = '([a-zA-Z0-9_]+)'
const METHOD_ID = `(${ID_CHAR}+(:${ID_CHAR}+)*)`
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]'
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`
const PARAMS = `((${PARAM})*)`
const PATH = `(\/[^#?]*)?`
const QUERY = `([?][^#]*)?`
const FRAGMENT = `(\#.*)?`
const DID_MATCHER = new RegExp(
  `^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`
)

function parse(didUrl) {
  if (didUrl === '' || !didUrl) return null
  const sections = didUrl.match(DID_MATCHER)
  if (sections) {
    const parts = {
      did: `did:${sections[1]}:${sections[2]}`,
      method: sections[1],
      id: sections[2],
      didUrl
    }
    if (sections[4]) {
      const params = sections[4].slice(1).split(';')
      parts.params = {}
      for (const p of params) {
        const kv = p.split('=')
        parts.params[kv[0]] = kv[1]
      }
    }
    if (sections[6]) parts.path = sections[6]
    if (sections[7]) parts.query = sections[7].slice(1)
    if (sections[8]) parts.fragment = sections[8].slice(1)
    return parts
  }
  return null
}

async function get(url) {
    try {
      const res = await fetch(url);
      
      if (res.status >= 400) {
        console.log(res);
        throw new Error("Bad response from server");
      }
      
      return await res.json();
    } catch (err) {
      console.error(err);
    }
}

function findKeyInsideDidDocument(didDocument, did) {
  for(const [key, value] of Object.entries(didDocument)) {
    if (Array.isArray(value)) {
      for (const key of value) {
        if (key.id && key.id === did) {
          return key;
        }
      }
    } else {
      if (value.id && value.id === did) {
        return value;
      }
    }
  }
}

export async function resolveDID(did) {
  if (!did.startsWith("did:web")) {
    return {
      didDocument: null,
      didDocumentMetadata: null,
      didResolutionMetadata: {
        error: "Not a Web DID",
        message: 'Not a valid Did' + did
      }
    }
  }

  let parsed = parse(did)
  if (parsed == null) {
      return {
      didDocument: null,
      didDocumentMetadata: null,
      didResolutionMetadata: {
        error: "Invalid DID",
        message: 'Not a valid Did' + did
      }
    }
  }

  let err = null
  let path = decodeURIComponent(parsed.id) + DOC_PATH
  const id = parsed.id.split(':')
  if (id.length > 1) {
    path = id.map(decodeURIComponent).join('/') + DOC_FILE
  }

  const url = `https://${path}`

  const didDocumentMetadata = {}
  let didDocument = {}

  try {
    didDocument = await get(url);
  } catch (error) {
    err = `DID must resolve to a valid https URL containing a JSON document: ${error}`
  }

  if (!didDocument) {
    err = `DID document is null`
  }

  // TODO: this excludes the use of query params
  const docIdMatchesDid = didDocument.id === did
  if (!docIdMatchesDid) {
    //err = 'DID document id ('+didDocument.id+') does not match requested did ('+did+')'
    didDocument = findKeyInsideDidDocument(didDocument, did);
  }

  const contentType =
    typeof didDocument['@context'] !== 'undefined'
      ? 'application/did+ld+json'
      : 'application/did+json'

  if (err) {
    return {
      didDocument,
      didDocumentMetadata,
      didResolutionMetadata: {
        error: 'notFound',
        message: err
      }
    }
  } else {
    return {
      didDocument,
      didDocumentMetadata,
      didResolutionMetadata: { contentType }
    }
  }
}
