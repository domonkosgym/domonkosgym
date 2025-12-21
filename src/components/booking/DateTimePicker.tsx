import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { hu } from "date-fns/locale";
import { Clock } from "lucide-react";

interface Booking {
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
}

interface BlockedSlot {
  blocked_date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
}

interface DateTimePickerProps {
  serviceId: string;
  serviceDuration: number;
  onSelect: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export const DateTimePicker = ({ 
  serviceId, 
  serviceDuration, 
  onSelect,
  selectedDate,
  selectedTime 
}: DateTimePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [bookedSlots, setBookedSlots] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Fetch bookings, blocked slots and set up realtime subscription
  useEffect(() => {
    fetchBookings();
    fetchBlockedSlots();

    const bookingsChannel = supabase
      .channel('bookings-changes')
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
      .channel('blocked-slots-changes')
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

  // Fetch available slots
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const { data } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('is_available', true);
      
      if (data) setAvailableSlots(data);
    };

    fetchAvailableSlots();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .rpc('get_booking_slots', { p_service_id: serviceId });

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    setBookedSlots(data || []);
  };

  const fetchBlockedSlots = async () => {
    const { data, error } = await supabase
      .from('blocked_time_slots')
      .select('blocked_date, start_time, end_time, all_day');

    if (error) {
      console.error('Error fetching blocked slots:', error);
      return;
    }

    setBlockedSlots(data || []);
  };

  // Generate time slots when date is selected
  useEffect(() => {
    if (!date) {
      setTimeSlots([]);
      return;
    }

    const dayOfWeek = date.getDay();
    const daySlots = availableSlots.filter(slot => slot.day_of_week === dayOfWeek);

    if (daySlots.length === 0) {
      setTimeSlots([]);
      return;
    }

    // Generate 30-minute slots
    const slots: string[] = [];
    daySlots.forEach(daySlot => {
      const startTime = daySlot.start_time;
      const endTime = daySlot.end_time;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (
        currentHour < endHour || 
        (currentHour === endHour && currentMin < endMin)
      ) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        // Check if slot is blocked
        const isBlocked = blockedSlots.some(blocked => {
          if (blocked.blocked_date !== format(date, 'yyyy-MM-dd')) return false;
          
          // If all_day is true, block entire day
          if (blocked.all_day) return true;
          
          const [blockedStartHour, blockedStartMin] = blocked.start_time.split(':').map(Number);
          const [blockedEndHour, blockedEndMin] = blocked.end_time.split(':').map(Number);
          
          const slotStart = currentHour * 60 + currentMin;
          const slotEnd = slotStart + serviceDuration;
          const blockedStart = blockedStartHour * 60 + blockedStartMin;
          const blockedEnd = blockedEndHour * 60 + blockedEndMin;
          
          return (slotStart < blockedEnd && slotEnd > blockedStart);
        });
        
        // Check if slot is booked
        const isBooked = bookedSlots.some(booking => {
          if (booking.scheduled_date !== format(date, 'yyyy-MM-dd')) return false;
          
          const bookingTime = booking.scheduled_time;
          const [bookingHour, bookingMin] = bookingTime.split(':').map(Number);
          
          // Check for time overlap
          const slotStart = currentHour * 60 + currentMin;
          const slotEnd = slotStart + serviceDuration;
          const bookingStart = bookingHour * 60 + bookingMin;
          const bookingEnd = bookingStart + booking.duration_minutes;
          
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });
        
        if (!isBooked && !isBlocked) {
          slots.push(timeString);
        }
        
        // Increment by 30 minutes
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour += 1;
        }
      }
    });

    setTimeSlots(slots);
  }, [date, bookedSlots, blockedSlots, availableSlots, serviceDuration, serviceId]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const handleTimeSelect = (time: string) => {
    if (date) {
      onSelect(date, time);
    }
  };

  // Disable past dates
  const disabledDates = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Válassz Dátumot</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-2 sm:p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={disabledDates}
            locale={hu}
            className="rounded-md border w-full scale-90 sm:scale-100"
            fromDate={new Date()}
            toDate={addDays(new Date(), 90)}
          />
        </CardContent>
      </Card>

      {date && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">
                Elérhető Időpontok - {format(date, 'yyyy. MMM dd.', { locale: hu })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {timeSlots.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Ezen a napon nincs elérhető időpont
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="w-full text-sm sm:text-base"
                    size="sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
