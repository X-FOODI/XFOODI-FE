import { Modal, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface CancelDishConfirmModalProps {
  open: boolean;
  dishName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CancelDishConfirmModal({
  open,
  dishName,
  onConfirm,
  onCancel,
  loading = false,
}: CancelDishConfirmModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-red-500">
          <ExclamationCircleOutlined />
          <span>Xác nhận hủy món</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} disabled={loading}>
          Không, giữ lại
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          onClick={onConfirm}
        >
          Đồng ý hủy
        </Button>,
      ]}
      className="dark:bg-[#1E293B]"
    >
      <div className="dark:text-zinc-200">
        <p>
          Bạn có chắc chắn muốn hủy món <strong>{dishName}</strong> khỏi hóa đơn không?
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
          Hành động này sẽ cập nhật lại tổng tiền của hóa đơn.
        </p>
      </div>
    </Modal>
  );
}
