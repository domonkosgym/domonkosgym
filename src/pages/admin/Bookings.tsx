import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, DollarSign, CheckCircle, XCircle, Plus, Trash2, Edit, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  price: number;
  paid: boolean;
  reschedule_count: number;
  services: {
    name: string;
    category: string;
  };
  created_at: string;
}

interface BlockedSlot {
  id: string;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  all_day: boolean;
}

// Generate 30-minute time slots from 00:00 to 23:30
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function Bookings() {
  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockMode, setBlockMode] = useState<'single' | 'multi'>('single');
  const [blockSingleDate, setBlockSingleDate] = useState<Date | undefined>(new Date());
  const [blockStartDate, setBlockStartDate] = useState<Date | undefined>(new Date());
  const [blockEndDate, setBlockEndDate] = useState<Date | undefined>(new Date());
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockAllDay, setBlockAllDay] = useState(false);

  // Reschedule state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState<string>("");

  useEffect(() => {
    fetchBookings();
    fetchBlockedSlots();

    // Set up realtime subscriptions
    const bookingsChannel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    const blockedChannel = supabase
      .channel('blocked-slots-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_time_slots'
        },
        () => {
          fetchBlockedSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedChannel);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            name,
            category
          )
        `)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_time_slots")
        .select("*")
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (error) {
      console.error("Error fetching blocked slots:", error);
      toast.error("Hiba történt a blokkolt időpontok betöltésekor");
    } finally {
      setBlockedLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      if (status === 'confirmed' && booking) {
        try {
          await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              serviceName: booking.services.name,
              scheduledDate: format(new Date(booking.scheduled_date), 'yyyy. MMMM dd.', { locale: hu }),
              scheduledTime: booking.scheduled_time,
            }
          });
          console.log('Confirmation email sent successfully');
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleOpenBlockDialog = () => {
    setIsBlockDialogOpen(true);
  };

  const handleBlockTime = async () => {
    // Validation
    if (blockMode === 'single' && !blockSingleDate) {
      toast.error("Kérlek válassz dátumot!");
      return;
    }
    
    if (blockMode === 'multi') {
      if (!blockStartDate || !blockEndDate) {
        toast.error("Kérlek válassz kezdő és befejező dátumot!");
        return;
      }
      if (blockStartDate > blockEndDate) {
        toast.error("A kezdő dátum nem lehet későbbi a befejező dátumnál!");
        return;
      }
    }

    try {
      const slots: any[] = [];
      
      if (blockMode === 'single' && blockSingleDate) {
        // Single day blocking
        slots.push({
          blocked_date: format(blockSingleDate, "yyyy-MM-dd"),
          start_time: blockAllDay ? "00:00:00" : `${blockStartTime}:00`,
          end_time: blockAllDay ? "23:59:59" : `${blockEndTime}:00`,
          reason: blockReason || null,
          all_day: blockAllDay,
        });
      } else if (blockMode === 'multi' && blockStartDate && blockEndDate) {
        // Multi-day blocking
        const dates: Date[] = [];
        let currentDate = new Date(blockStartDate);
        const lastDate = new Date(blockEndDate);

        while (currentDate <= lastDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        dates.forEach((date, index) => {
          const isFirstDay = index === 0;
          const isLastDay = index === dates.length - 1;
          const isSingleDay = dates.length === 1;

          let startTime = "00:00:00";
          let endTime = "23:59:59";
          let isAllDay = blockAllDay;

          if (isSingleDay) {
            startTime = blockAllDay ? "00:00:00" : `${blockStartTime}:00`;
            endTime = blockAllDay ? "23:59:59" : `${blockEndTime}:00`;
          } else if (isFirstDay) {
            startTime = blockAllDay ? "00:00:00" : `${blockStartTime}:00`;
            endTime = "23:59:59";
            isAllDay = false;
          } else if (isLastDay) {
            startTime = "00:00:00";
            endTime = blockAllDay ? "23:59:59" : `${blockEndTime}:00`;
            isAllDay = false;
          } else {
            startTime = "00:00:00";
            endTime = "23:59:59";
            isAllDay = true;
          }

          slots.push({
            blocked_date: format(date, "yyyy-MM-dd"),
            start_time: startTime,
            end_time: endTime,
            reason: blockReason || null,
            all_day: isAllDay,
          });
        });
      }

      const { error } = await supabase
        .from("blocked_time_slots")
        .insert(slots);

      if (error) throw error;

      toast.success(`${slots.length} nap sikeresen blokkolva!`);
      fetchBlockedSlots();
      
      // Reset state
      setBlockReason("");
      setBlockAllDay(false);
      setBlockStartTime("09:00");
      setBlockEndTime("17:00");
      setBlockSingleDate(new Date());
      setBlockStartDate(new Date());
      setBlockEndDate(new Date());
      setIsBlockDialogOpen(false);
    } catch (error) {
      console.error("Error blocking time:", error);
      toast.error("Hiba történt a blokkolás során");
    }
  };

  const isDateBlocked = (day: Date) => {
    const dateString = format(day, "yyyy-MM-dd");
    return blockedSlots.some((slot) => slot.blocked_date === dateString);
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blocked_time_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Blokkolt időpont törölve!");
      fetchBlockedSlots();
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Hiba történt a törlés során");
    }
  };

  const handleRescheduleBooking = async (bookingId: string, currentRescheduleCount: number) => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Kérlek válassz új dátumot és időpontot!");
      return;
    }

    const newRescheduleCount = currentRescheduleCount + 1;

    // If this would be the 3rd reschedule, cancel the booking instead
    if (newRescheduleCount > 2) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId);

        if (error) throw error;

        toast.error("Harmadik időpontmódosítás nem lehetséges! A foglalás törölve.");
        setRescheduleBookingId(null);
        setRescheduleDate(undefined);
        setRescheduleTime("");
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Hiba történt a törlés során");
      }
      return;
    }

    try {
      const newDate = format(rescheduleDate, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from('bookings')
        .update({
          scheduled_date: newDate,
          scheduled_time: rescheduleTime,
          reschedule_count: newRescheduleCount
        })
        .eq('id', bookingId);

      if (error) throw error;

      if (newRescheduleCount === 1) {
        toast.success("Első időpontmódosítás sikeresen megtörtént!");
      } else if (newRescheduleCount === 2) {
        toast.warning("Második (utolsó) időpontmódosítás sikeresen megtörtént! Figyelem: további módosítás nem lehetséges.");
      }

      setRescheduleBookingId(null);
      setRescheduleDate(undefined);
      setRescheduleTime("");
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast.error("Hiba történt az időpontmódosítás során");
    }
  };

  const cancelReschedule = () => {
    setRescheduleBookingId(null);
    setRescheduleDate(undefined);
    setRescheduleTime("");
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast.success("Foglalás törölve!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Hiba történt a törlés során");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Megerősítve';
      case 'pending':
        return 'Függőben';
      case 'cancelled':
        return 'Lemondva';
      case 'completed':
        return 'Teljesítve';
      default:
        return status;
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.scheduled_date), day)
    );
  };

  const handleDayClick = (day: Date) => {
    const dayBookings = getBookingsForDay(day);
    if (dayBookings.length > 0) {
      setSelectedDate(day);
      setIsDialogOpen(true);
    }
  };

  const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : [];

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-lg">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Időpontfoglalások</h1>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">Foglalások</TabsTrigger>
          <TabsTrigger value="blocked" className="text-xs sm:text-sm">Blokkolt időpontok</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4 sm:space-y-6">
          <div className="flex justify-end gap-2">
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              onClick={() => setView('calendar')}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Naptár</span>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
              size="sm"
              className="text-xs sm:text-sm"
            >
              Lista
            </Button>
          </div>

          {view === 'calendar' ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center gap-2">
                  <CardTitle className="text-base sm:text-lg">{format(currentMonth, 'yyyy. MMMM', { locale: hu })}</CardTitle>
                  <div className="flex gap-1 sm:gap-2">
                    <Button variant="outline" size="sm" onClick={previousMonth} className="h-8 w-8 p-0">
                      ←
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
                  {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map(day => (
                    <div key={day} className="text-center font-semibold text-[10px] sm:text-sm py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((day, idx) => {
                    const dayBookings = getBookingsForDay(day);
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const hasBookings = dayBookings.length > 0;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "min-h-[50px] sm:min-h-[100px] border rounded sm:rounded-lg p-0.5 sm:p-2 transition-all",
                          !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                          isSameDay(day, new Date()) && "border-primary border-2",
                          hasBookings && "cursor-pointer hover:shadow-lg hover:bg-accent/5"
                        )}
                      >
                        <div className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 flex justify-between items-center">
                          <span>{format(day, 'd')}</span>
                          {hasBookings && (
                            <Badge variant="secondary" className="text-[8px] sm:text-xs h-4 sm:h-5 px-1">
                              {dayBookings.length}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                          {dayBookings.slice(0, 2).map((booking) => (
                            <div
                              key={booking.id}
                              className={cn(
                                "text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate",
                                getStatusColor(booking.status),
                                "text-white"
                              )}
                              title={`${booking.scheduled_time} - ${booking.customer_name} - ${booking.services.name}`}
                            >
                              {booking.scheduled_time.substring(0, 5)} - {booking.customer_name}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground text-center">
                              +{dayBookings.length - 2} további
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                    <span className="text-[10px] sm:text-sm">Megerősítve</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
                    <span className="text-[10px] sm:text-sm">Függőben</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                    <span className="text-[10px] sm:text-sm">Lemondva</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                    <span className="text-[10px] sm:text-sm">Teljesítve</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Összes Foglalás</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum & Idő</TableHead>
                      <TableHead>Ügyfél</TableHead>
                      <TableHead>Szolgáltatás</TableHead>
                      <TableHead>Ár</TableHead>
                      <TableHead>Státusz</TableHead>
                      <TableHead>Műveletek</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(booking.scheduled_date), 'yyyy. MM. dd.', { locale: hu })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {booking.scheduled_time.substring(0, 5)} ({booking.duration_minutes} perc)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.customer_name}</span>
                            <span className="text-sm text-muted-foreground">{booking.customer_email}</span>
                            {booking.customer_phone && (
                              <span className="text-sm text-muted-foreground">{booking.customer_phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.services.name}</span>
                            <span className="text-sm text-muted-foreground">{booking.services.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.price.toLocaleString()} Ft</span>
                            <Badge variant={booking.paid ? "default" : "secondary"} className="w-fit">
                              {booking.paid ? 'Fizetve' : 'Fizetésre vár'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={cn("text-white w-fit", getStatusColor(booking.status))}>
                              {getStatusText(booking.status)}
                            </Badge>
                            {booking.status === 'confirmed' && booking.reschedule_count > 0 && (
                              <Badge variant="outline" className={cn(
                                "w-fit text-xs",
                                booking.reschedule_count === 2 && "border-destructive text-destructive"
                              )}>
                                {booking.reschedule_count}. módosítás
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="blocked" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Blokkold le azokat az időpontokat, amikor nem vagy elérhető
            </p>
            <Button onClick={handleOpenBlockDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Új blokkolás
            </Button>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Naptár</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={undefined}
                  locale={hu}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border w-full"
                  modifiers={{
                    blocked: (date) => isDateBlocked(date),
                  }}
                  modifiersStyles={{
                    blocked: {
                      backgroundColor: 'hsl(var(--destructive) / 0.2)',
                      color: 'hsl(var(--destructive))',
                      fontWeight: 'bold',
                    },
                  }}
                />
                <div className="mt-4 flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--destructive) / 0.2)' }}></div>
                    <span className="text-sm">Blokkolt napok</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blokkolt időpontok listája</CardTitle>
              </CardHeader>
              <CardContent>
                {blockedSlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Még nincsenek blokkolt időpontok
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {blockedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(parseISO(slot.blocked_date), "yyyy. MMMM d.", { locale: hu })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {slot.all_day
                              ? "Egész nap"
                              : `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`}
                          </p>
                          {slot.reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {slot.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bookings Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Foglalások - {selectedDate && format(selectedDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedDayBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nincs foglalás ezen a napon
              </p>
            ) : (
              selectedDayBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          {booking.scheduled_time.substring(0, 5)} ({booking.duration_minutes} perc)
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.services.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={cn("text-white", getStatusColor(booking.status))}>
                          {getStatusText(booking.status)}
                        </Badge>
                        {booking.status === 'confirmed' && booking.reschedule_count > 0 && (
                          <Badge variant="outline" className={cn(
                            booking.reschedule_count === 2 && "border-destructive text-destructive"
                          )}>
                            {booking.reschedule_count === 1 ? "1. módosítás" : "2. módosítás (utolsó)"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.customer_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${booking.customer_email}`} className="text-primary hover:underline">
                          {booking.customer_email}
                        </a>
                      </div>
                      
                      {booking.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${booking.customer_phone}`} className="text-primary hover:underline">
                            {booking.customer_phone}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.price.toLocaleString()} Ft</span>
                        <Badge variant={booking.paid ? "default" : "secondary"} className="ml-2">
                          {booking.paid ? 'Fizetve' : 'Fizetésre vár'}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        Kategória: {booking.services.category}
                      </div>
                    </div>

                    {/* Reschedule section for confirmed bookings */}
                    {booking.status === 'confirmed' && rescheduleBookingId === booking.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          {booking.reschedule_count === 0 && (
                            <span>Ez lesz az első időpontmódosítás (még 1 marad utána)</span>
                          )}
                          {booking.reschedule_count === 1 && (
                            <span className="text-amber-600 font-medium">
                              Figyelem! Ez a második (utolsó) módosítási lehetőség!
                            </span>
                          )}
                          {booking.reschedule_count >= 2 && (
                            <span className="text-destructive font-medium">
                              Harmadik módosítás nem lehetséges! Ha folytatod, a foglalás törlődik.
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Új dátum</Label>
                            <Calendar
                              mode="single"
                              selected={rescheduleDate}
                              onSelect={setRescheduleDate}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              className="rounded-md border"
                              locale={hu}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Új időpont</Label>
                            <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                              <SelectTrigger>
                                <SelectValue placeholder="Válassz időpontot" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRescheduleBooking(booking.id, booking.reschedule_count)}
                            disabled={!rescheduleDate || !rescheduleTime}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {booking.reschedule_count >= 2 ? "Törlés" : "Időpont módosítása"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelReschedule}
                          >
                            Mégse
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap">
                      {booking.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            updateBookingStatus(booking.id, 'confirmed');
                            setIsDialogOpen(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Megerősítés
                        </Button>
                      )}
                      {booking.status === 'confirmed' && rescheduleBookingId !== booking.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRescheduleBookingId(booking.id);
                            setRescheduleDate(undefined);
                            setRescheduleTime("");
                          }}
                          disabled={booking.reschedule_count >= 2}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {booking.reschedule_count >= 2 
                            ? "Módosítás nem lehetséges" 
                            : `Időpont módosítása (${2 - booking.reschedule_count} alkalom maradt)`}
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            updateBookingStatus(booking.id, 'cancelled');
                            setIsDialogOpen(false);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Lemondás
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteBooking(booking.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Törlés
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Időpont blokkolása</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Block Mode Selection */}
            <div className="space-y-2">
              <Label>Blokkolás típusa</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={blockMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setBlockMode('single')}
                  className="w-full"
                >
                  Egy nap
                </Button>
                <Button
                  type="button"
                  variant={blockMode === 'multi' ? 'default' : 'outline'}
                  onClick={() => setBlockMode('multi')}
                  className="w-full"
                >
                  Többnapos
                </Button>
              </div>
            </div>

            {/* Date Selection */}
            {blockMode === 'single' ? (
              <div className="space-y-2">
                <Label>Dátum</Label>
                <Calendar
                  mode="single"
                  selected={blockSingleDate}
                  onSelect={setBlockSingleDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border mx-auto"
                  locale={hu}
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kezdő dátum</Label>
                  <Calendar
                    mode="single"
                    selected={blockStartDate}
                    onSelect={setBlockStartDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                    locale={hu}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Befejező dátum</Label>
                  <Calendar
                    mode="single"
                    selected={blockEndDate}
                    onSelect={setBlockEndDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                    locale={hu}
                  />
                </div>
              </div>
            )}

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="block-all-day"
                checked={blockAllDay}
                onCheckedChange={(checked) => setBlockAllDay(checked === true)}
              />
              <Label htmlFor="block-all-day" className="cursor-pointer">
                Egész nap
              </Label>
            </div>

            {/* Time Selection */}
            {!blockAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block-start-time">
                    {blockMode === 'single' ? "Kezdés" : "Első nap kezdése"}
                  </Label>
                  <Select
                    value={blockStartTime}
                    onValueChange={setBlockStartTime}
                  >
                    <SelectTrigger id="block-start-time">
                      <SelectValue placeholder="Válassz időpontot" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end-time">
                    {blockMode === 'single' ? "Befejezés" : "Utolsó nap befejezése"}
                  </Label>
                  <Select
                    value={blockEndTime}
                    onValueChange={setBlockEndTime}
                  >
                    <SelectTrigger id="block-end-time">
                      <SelectValue placeholder="Válassz időpontot" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIME_SLOTS.filter(time => time > blockStartTime).map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Preview */}
            {blockMode === 'multi' && blockStartDate && blockEndDate && !blockAllDay && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Többnapos blokkolás:</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li>• Első nap ({format(blockStartDate, "MM. d.", { locale: hu })}): {blockStartTime}-tól éjfélig</li>
                  {blockStartDate && blockEndDate && Math.ceil((blockEndDate.getTime() - blockStartDate.getTime()) / (1000 * 60 * 60 * 24)) > 1 && (
                    <li>• Köztes napok: egész nap blokkolva</li>
                  )}
                  <li>• Utolsó nap ({format(blockEndDate, "MM. d.", { locale: hu })}): éjféltől {blockEndTime}-ig</li>
                </ul>
              </div>
            )}

            {blockMode === 'single' && blockSingleDate && !blockAllDay && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Blokkolva:</strong> {format(blockSingleDate, "yyyy. MMMM d.", { locale: hu })} {blockStartTime} - {blockEndTime}
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="block-reason">Indoklás (opcionális)</Label>
              <Textarea
                id="block-reason"
                placeholder="Pl.: Szabadság, konferencia..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsBlockDialogOpen(false)}
              >
                Mégse
              </Button>
              <Button onClick={handleBlockTime}>
                Blokkolás
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
