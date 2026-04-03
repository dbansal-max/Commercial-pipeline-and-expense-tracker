import React from 'react';
import Records from '../../pages/Records/Records';

const PermissionBasedRecords = () => {
  // The Records component now handles all permissions internally
  // based on the 4-section structure
  return (
    <Records
      embedded={true}
    />
  );
};

export default PermissionBasedRecords;
