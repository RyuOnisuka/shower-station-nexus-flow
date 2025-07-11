import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
}

interface UserAction {
  action: string;
  component: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  details?: any;
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  databaseResponseTime: number;
  timestamp?: string;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private performanceObserver?: PerformanceObserver;
  private errorLogs: ErrorLog[] = [];
  private userActions: UserAction[] = [];
  private systemMetrics: SystemMetrics[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
    this.setupErrorMonitoring();
    this.setupSystemMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceMonitoring() {
    // วัดเวลาการโหลดหน้า
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.logPerformance({
          pageLoadTime: loadTime,
          domContentLoaded: 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0
        });
      });

      // วัด First Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          this.performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                this.logPerformance({
                  pageLoadTime: 0,
                  domContentLoaded: 0,
                  firstContentfulPaint: entry.startTime,
                  largestContentfulPaint: 0,
                  cumulativeLayoutShift: 0,
                  firstInputDelay: 0
                });
              }
            }
          });
          this.performanceObserver.observe({ entryTypes: ['paint'] });
        } catch (error) {
          console.warn('Performance monitoring not supported:', error);
        }
      }
    }
  }

  private setupErrorMonitoring() {
    if (typeof window !== 'undefined') {
      // จับ JavaScript errors
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message,
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.userId,
          sessionId: this.sessionId
        });
      });

      // จับ unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.userId,
          sessionId: this.sessionId
        });
      });
    }
  }

  private setupSystemMonitoring() {
    // วัดการใช้ memory
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.logSystemMetrics({
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
          cpuUsage: 0, // ไม่สามารถวัดได้ใน browser
          networkLatency: 0,
          databaseResponseTime: 0,
          timestamp: new Date().toISOString()
        });
      }, 30000); // ทุก 30 วินาที
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public logPerformance(metrics: PerformanceMetrics) {
    this.sendToServer('performance', {
      ...metrics,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    });
  }

  public logError(error: ErrorLog) {
    this.errorLogs.push(error);
    this.sendToServer('error', error);
    
    // ส่ง alert ถ้าเป็น error วิกฤต
    if (error.message.includes('Critical') || error.message.includes('Fatal')) {
      this.sendAlert('critical_error', error);
    }
  }

  public logUserAction(action: Omit<UserAction, 'timestamp' | 'sessionId'>) {
    const userAction: UserAction = {
      ...action,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
    
    this.userActions.push(userAction);
    this.sendToServer('user_action', userAction);
  }

  public logSystemMetrics(metrics: SystemMetrics) {
    this.systemMetrics.push({
      ...metrics,
      timestamp: new Date().toISOString()
    });
    this.sendToServer('system_metrics', metrics);
  }

  public logDatabaseQuery(query: string, duration: number, success: boolean) {
    this.sendToServer('database_query', {
      query,
      duration,
      success,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    });
  }

  public logApiCall(endpoint: string, method: string, duration: number, status: number) {
    this.sendToServer('api_call', {
      endpoint,
      method,
      duration,
      status,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    });
  }

  private async sendToServer(type: string, data: any) {
    try {
      // ส่งไปยัง audit_logs แทน monitoring_logs
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: `monitoring_${type}`,
          table_name: 'monitoring',
          old_values: null,
          new_values: data,
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to send monitoring data:', error);
      }
    } catch (error) {
      console.error('Monitoring service error:', error);
    }
  }

  private async sendAlert(type: string, data: any) {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          type: 'suspicious_activity', // ใช้ type ที่มีอยู่
          severity: 'high',
          message: `System Alert: ${type}`,
          details: data,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to send alert:', error);
      }
    } catch (error) {
      console.error('Alert service error:', error);
    }
  }

  public getMetrics() {
    return {
      errorCount: this.errorLogs.length,
      actionCount: this.userActions.length,
      systemMetricsCount: this.systemMetrics.length,
      sessionId: this.sessionId
    };
  }

  public cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Global monitoring service instance
const monitoringService = new MonitoringService();

// Hook สำหรับใช้ monitoring ใน components
export const useMonitoring = () => {
  const componentRef = useRef<string>('');

  useEffect(() => {
    // ตั้งชื่อ component สำหรับ tracking
    const componentName = new Error().stack?.split('\n')[2]?.match(/at\s+(\w+)/)?.[1] || 'Unknown';
    componentRef.current = componentName;

    // Log component mount
    monitoringService.logUserAction({
      action: 'component_mount',
      component: componentName
    });

    return () => {
      // Log component unmount
      monitoringService.logUserAction({
        action: 'component_unmount',
        component: componentName
      });
    };
  }, []);

  const logAction = (action: string, details?: any) => {
    monitoringService.logUserAction({
      action,
      component: componentRef.current,
      details
    });
  };

  const logError = (error: Error, componentStack?: string) => {
    monitoringService.logError({
      message: error.message,
      stack: error.stack,
      componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: monitoringService['userId'],
      sessionId: monitoringService['sessionId']
    });
  };

  const logPerformance = (metrics: Partial<PerformanceMetrics>) => {
    monitoringService.logPerformance(metrics as PerformanceMetrics);
  };

  const setUserId = (userId: string) => {
    monitoringService.setUserId(userId);
  };

  return {
    logAction,
    logError,
    logPerformance,
    setUserId,
    getMetrics: monitoringService.getMetrics.bind(monitoringService)
  };
};

// Hook สำหรับติดตาม API calls
export const useApiMonitoring = () => {
  const monitorApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      monitoringService.logApiCall(endpoint, method, duration, 200);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      monitoringService.logApiCall(endpoint, method, duration, 500);
      monitoringService.logError({
        message: `API Error: ${endpoint}`,
        stack: (error as Error)?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      
      throw error;
    }
  };

  return { monitorApiCall };
};

// Hook สำหรับติดตาม database queries
export const useDatabaseMonitoring = () => {
  const monitorQuery = async <T>(
    queryFn: () => Promise<T>,
    queryName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      monitoringService.logDatabaseQuery(queryName, duration, true);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      monitoringService.logDatabaseQuery(queryName, duration, false);
      monitoringService.logError({
        message: `Database Error: ${queryName}`,
        stack: (error as Error)?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      
      throw error;
    }
  };

  return { monitorQuery };
};

// Cleanup function สำหรับใช้ใน App component
export const cleanupMonitoring = () => {
  monitoringService.cleanup();
}; 