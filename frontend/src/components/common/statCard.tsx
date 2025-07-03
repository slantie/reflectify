import { Card } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export const StatCard = ({ title, value, icon: Icon, onClick }: StatCardProps) => (
  <Card 
    onClick={onClick}
    className="relative overflow-hidden cursor-pointer bg-white hover:bg-orange-50 border border-gray-100 transition-all duration-300 hover:shadow-lg rounded-2xl group"
  >
    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
    <div className="p-4 flex justify-between items-center">
      <div className="space-y-1">
        <p className="text-base font-medium text-gray-600">{title}</p>
        <p className="text-4xl font-bold text-gray-900 group-hover:text-orange-600">
          {value}
        </p>
      </div>
      <Icon className="h-14 w-14 text-orange-500 group-hover:text-orange-600" />
    </div>
  </Card>
);
