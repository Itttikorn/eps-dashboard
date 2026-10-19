import React from 'react';
import { Modal } from 'antd';
import { CsvUploadZone } from './CsvUploadZone';
import { IngestionBatchRecord } from '../../api/types';

export interface CsvUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (record: IngestionBatchRecord) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const handleSuccess = (record: IngestionBatchRecord) => {
    onSuccess?.(record);
    // Auto-close dialog after 2.5s on successful ingestion
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
      data-testid="csv-upload-modal"
      styles={{ content: { padding: 0 } }}
    >
      <div>
        <CsvUploadZone onUploadSuccess={handleSuccess} />
      </div>
    </Modal>
  );
};

