declare module 'lucide-react' {
  import * as React from 'react';
  
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export type Icon = React.FC<IconProps>;
  
  // Re-export all exports from lucide-react as Icon type
  export const Users: Icon;
  export const UserCheck: Icon;
  export const UserX: Icon;
  export const UserCog: Icon;
  export const UserPlus: Icon;
  export const Shield: Icon;
  export const Lock: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const DollarSign: Icon;
  export const IndianRupee: Icon;
  export const TrendingUp: Icon;
  export const TrendingDown: Icon;
  export const FileText: Icon;
  export const FileSpreadsheet: Icon;
  export const Download: Icon;
  export const Wallet: Icon;
  export const ArrowLeft: Icon;
  export const LogOut: Icon;
  export const Menu: Icon;
  export const X: Icon;
  export const LayoutDashboard: Icon;
  export const GraduationCap: Icon;
  export const BarChart3: Icon;
  export const Settings: Icon;
  export const Sun: Icon;
  export const Moon: Icon;
  export const Globe: Icon;
  export const Search: Icon;
  export const Filter: Icon;
  export const Plus: Icon;
  export const Pencil: Icon;
  export const Edit: Icon;
  export const Trash2: Icon;
  export const Save: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const XCircle: Icon;
  export const AlertCircle: Icon;
  export const Info: Icon;
  export const Loader2: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Calendar: Icon;
  export const Clock: Icon;
  export const Mail: Icon;
  export const Phone: Icon;
  export const MapPin: Icon;
  export const Building: Icon;
  export const Building2: Icon;
  export const Database: Icon;
  export const Mosque: Icon;
  export const UserSquare2: Icon;
}
