export const mapTbl = {};

// static mapping records between aTblId && ncId
export const addToMappingTbl = function addToMappingTbl(
  aTblId,
  ncId,
  ncName,
  parent?,
) {
  mapTbl[aTblId] = {
    ncId: ncId,
    ncParent: parent,
    // name added to assist in quick debug
    ncName: ncName,
  };
};

// get AtID from airtable ID
export const getNcIdFromAtId = function getNcIdFromAtId(aId) {
  return mapTbl[aId]?.ncId;
};

// get atm Parent from airtable ID
export const getNcParentFromAtId = function getNcParentFromAtId(aId) {
  return mapTbl[aId]?.ncParent;
};

// get atm-title from airtable ID
export const getNcNameFromAtId = function getNcNameFromAtId(aId) {
  return mapTbl[aId]?.ncName;
};
