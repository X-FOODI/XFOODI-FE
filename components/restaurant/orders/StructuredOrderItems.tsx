import { Button } from "antd";
import { MinusOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

interface OrderItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
  status?: string;
  statusName?: string;
  dishId?: string | null;
  comboId?: string | null;
  parentId?: string | null;
  comboName?: string | null;
  comboPrice?: number | null;
}

interface StructuredOrderItemsProps {
  items: OrderItem[];
  isPaid: boolean;
  onUpdateItems: (newItems: OrderItem[]) => void;
  onDeleteItem: (item: OrderItem) => void;
}

export default function StructuredOrderItems({
  items,
  isPaid,
  onUpdateItems,
  onDeleteItem,
}: StructuredOrderItemsProps) {
  // Group items by parentId
  const topLevelItems: OrderItem[] = [];
  const childrenMap: Record<string, OrderItem[]> = {};
  
  // First, find all parentIds that exist
  const parentIds = new Set(items.map(i => i.parentId).filter(Boolean));

  items.forEach((item) => {
    if (item.parentId && parentIds.has(item.parentId)) {
      if (!childrenMap[item.parentId]) {
        childrenMap[item.parentId] = [];
      }
      childrenMap[item.parentId].push(item);
    } else {
      topLevelItems.push(item);
    }
  });

  // But wait! If an item has parentId but we couldn't find the parent, what then?
  // We'll assume topLevelItems are those without parentId, OR their parentId is not among any item's ID.
  // Actually, wait, parentId is the ID of the parent OrderDetail, or is it a virtual grouping ID?
  // Let's assume parentId is a string that links them. If they share a parentId but there is no item with id === parentId, 
  // then the combo header is virtual (comboName, comboPrice).
  
  // Let's regroup properly:
  // If items share parentId, they belong to the same combo.
  const groupedByParent: Record<string, OrderItem[]> = {};
  const noParent: OrderItem[] = [];

  items.forEach(item => {
    if (item.parentId) {
      if (!groupedByParent[item.parentId]) {
        groupedByParent[item.parentId] = [];
      }
      groupedByParent[item.parentId].push(item);
    } else {
      noParent.push(item);
    }
  });

  const handleQuantityChange = (idToChange: string, newQty: number, parentIdToChange?: string | null) => {
    if (newQty < 1) return;
    
    const newItems = items.map(item => {
      // If changing a top level item
      if (item.id === idToChange) {
        return { ...item, quantity: newQty };
      }
      // If changing a combo header (all children quantities should ideally be updated proportionally, 
      // but let's just update all items with this parentId if the parent itself is updated, or just the parent)
      // Actually, if we change the combo quantity, we should update the quantity of all items in that combo.
      if (parentIdToChange && item.parentId === parentIdToChange) {
        return { ...item, quantity: newQty };
      }
      return item;
    });

    onUpdateItems(newItems);
  };

  const handleComboQuantityChange = (parentId: string, newQty: number) => {
    if (newQty < 1) return;
    const newItems = items.map(item => {
      if (item.parentId === parentId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateItems(newItems);
  };

  const handleDeleteCombo = (parentId: string) => {
    // We just pass a fake item to the delete handler to show the modal
    const comboItem = groupedByParent[parentId]?.[0];
    if (comboItem) {
      onDeleteItem({ ...comboItem, name: comboItem.comboName || "Combo" });
    }
  };

  return (
    <div className="space-y-3">
      {/* Render standalone items */}
      {noParent.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-start p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#1E293B]"
        >
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              {item.name}
            </p>
            {item.note && (
              <p className="text-xs text-red-500 italic mt-0.5">Ghi chú: {item.note}</p>
            )}
            {!isPaid && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800">
                  <button
                    className="w-7 h-7 flex items-center justify-center hover:text-[#FF5A2C] disabled:opacity-50"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <MinusOutlined className="text-xs" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="w-7 h-7 flex items-center justify-center hover:text-[#FF5A2C]"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <PlusOutlined className="text-xs" />
                  </button>
                </div>
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small"
                  onClick={() => onDeleteItem(item)}
                />
              </div>
            )}
            {isPaid && (
              <span className="text-xs text-amber-500 font-bold mt-1 inline-block">x{item.quantity}</span>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {(item.price * item.quantity).toLocaleString("vi-VN")}đ
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Đơn giá: {item.price.toLocaleString("vi-VN")}đ</p>
          </div>
        </div>
      ))}

      {/* Render combos */}
      {Object.entries(groupedByParent).map(([parentId, comboItems]) => {
        const firstItem = comboItems[0];
        const comboName = firstItem.comboName || "Combo";
        const comboPrice = firstItem.comboPrice || 0;
        const comboQuantity = firstItem.quantity; // Assuming all items in combo share the same quantity multiplier

        return (
          <div
            key={parentId}
            className="flex flex-col p-3 rounded-lg border border-[#FF5A2C]/20 bg-orange-50/50 dark:bg-[#FF5A2C]/5"
          >
            {/* Combo Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-bold text-[#FF5A2C] text-sm uppercase">
                  {comboName}
                </p>
                {!isPaid && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-orange-200 dark:border-orange-900/50 rounded-md bg-white dark:bg-zinc-900">
                      <button
                        className="w-7 h-7 flex items-center justify-center text-orange-600 hover:text-[#FF5A2C] disabled:opacity-50"
                        onClick={() => handleComboQuantityChange(parentId, comboQuantity - 1)}
                        disabled={comboQuantity <= 1}
                      >
                        <MinusOutlined className="text-xs" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-orange-700 dark:text-orange-400">{comboQuantity}</span>
                      <button
                        className="w-7 h-7 flex items-center justify-center text-orange-600 hover:text-[#FF5A2C]"
                        onClick={() => handleComboQuantityChange(parentId, comboQuantity + 1)}
                      >
                        <PlusOutlined className="text-xs" />
                      </button>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      size="small"
                      onClick={() => handleDeleteCombo(parentId)}
                    />
                  </div>
                )}
                {isPaid && (
                  <span className="text-xs text-amber-500 font-bold mt-1 inline-block">x{comboQuantity}</span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#FF5A2C] text-sm">
                  {(comboPrice * comboQuantity).toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xs text-orange-400/80 mt-0.5">Đơn giá: {comboPrice.toLocaleString("vi-VN")}đ</p>
              </div>
            </div>

            {/* Combo Children */}
            <div className="pl-4 space-y-1.5 border-l-2 border-orange-200 dark:border-orange-900 ml-1">
              {comboItems.map((child) => (
                <div key={child.id} className="flex justify-between text-sm">
                  <div className="text-gray-600 dark:text-zinc-400 flex gap-2">
                    <span>↳</span>
                    <span>{child.name}</span>
                  </div>
                  {/* Assuming child price is 0 or included in combo, we only show it if it's > 0 */}
                  {child.price > 0 && (
                    <span className="text-gray-500 text-xs">
                      +{(child.price * child.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
