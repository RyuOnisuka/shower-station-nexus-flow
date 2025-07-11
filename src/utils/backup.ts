import { supabase } from '@/integrations/supabase/client';

interface BackupConfig {
  tables: string[];
  includeData: boolean;
  includeSchema: boolean;
  compression: boolean;
  encryption: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  tables: string[];
  size: number;
  checksum: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

interface RestoreConfig {
  backupId: string;
  tables?: string[];
  overwrite: boolean;
  validate: boolean;
}

class BackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  // สร้าง backup ของข้อมูล
  async createBackup(): Promise<BackupMetadata> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    try {
      // สร้าง backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        tables: this.config.tables,
        size: 0,
        checksum: '',
        status: 'pending'
      };

      // เก็บข้อมูลจากแต่ละตาราง
      const backupData: any = {};
      
      for (const table of this.config.tables) {
        // ใช้ type assertion เพื่อ bypass type checking
        const { data, error } = await (supabase as any)
          .from(table)
          .select('*');

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data;
      }

      // สร้าง schema information ถ้าต้องการ
      if (this.config.includeSchema) {
        backupData._schema = await this.getTableSchemas();
      }

      // บีบอัดข้อมูลถ้าต้องการ
      let processedData = backupData;
      if (this.config.compression) {
        processedData = await this.compressData(backupData);
      }

      // เข้ารหัสข้อมูลถ้าต้องการ
      if (this.config.encryption) {
        processedData = await this.encryptData(processedData);
      }

      // คำนวณ checksum
      const checksum = await this.calculateChecksum(processedData);
      
      // บันทึก backup ลง storage
      const backupSize = await this.saveBackup(backupId, processedData);
      
      // อัปเดต metadata
      metadata.size = backupSize;
      metadata.checksum = checksum;
      metadata.status = 'completed';

      // บันทึก metadata ลง database
      await this.saveBackupMetadata(metadata);

      return metadata;

    } catch (error) {
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        tables: this.config.tables,
        size: 0,
        checksum: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.saveBackupMetadata(metadata);
      throw error;
    }
  }

  // กู้คืนข้อมูลจาก backup
  async restoreBackup(config: RestoreConfig): Promise<void> {
    try {
      // ดึง backup metadata
      const metadata = await this.getBackupMetadata(config.backupId);
      
      if (!metadata) {
        throw new Error('Backup not found');
      }

      if (metadata.status !== 'completed') {
        throw new Error(`Backup status is ${metadata.status}`);
      }

      // โหลด backup data
      const backupData = await this.loadBackup(config.backupId);
      
      // ถอดรหัสข้อมูลถ้าจำเป็น
      let processedData = backupData;
      if (this.config.encryption) {
        processedData = await this.decryptData(processedData);
      }

      // ขยายข้อมูลถ้าจำเป็น
      if (this.config.compression) {
        processedData = await this.decompressData(processedData);
      }

      // ตรวจสอบ checksum
      if (config.validate) {
        const currentChecksum = await this.calculateChecksum(processedData);
        if (currentChecksum !== metadata.checksum) {
          throw new Error('Backup data corruption detected');
        }
      }

      // เริ่ม transaction (ใช้ raw SQL แทน)
      try {
        // ใช้ raw SQL สำหรับ transaction
        await supabase.rpc('begin_transaction' as any);
      } catch (error) {
        console.warn('Transaction not supported, continuing without transaction');
      }

      try {
        // กู้คืนข้อมูลตามตารางที่ระบุ
        const tablesToRestore = config.tables || metadata.tables;
        
        for (const table of tablesToRestore) {
          if (processedData[table]) {
            // ลบข้อมูลเดิมถ้าต้องการ overwrite
            if (config.overwrite) {
              const { error: deleteError } = await (supabase as any)
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // ไม่ลบ dummy record

              if (deleteError) {
                throw new Error(`Failed to clear table ${table}: ${deleteError.message}`);
              }
            }

            // เพิ่มข้อมูลใหม่
            const { error: insertError } = await (supabase as any)
              .from(table)
              .insert(processedData[table]);

            if (insertError) {
              throw new Error(`Failed to restore table ${table}: ${insertError.message}`);
            }
          }
        }

        // Commit transaction
        try {
          await supabase.rpc('commit_transaction' as any);
        } catch (error) {
          console.warn('Commit not supported');
        }

      } catch (error) {
        // Rollback transaction
        try {
          await supabase.rpc('rollback_transaction' as any);
        } catch (rollbackError) {
          console.warn('Rollback not supported');
        }
        throw error;
      }

    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  // ดึงรายการ backups
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      // ใช้ audit_logs แทน backup_metadata
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'backup_created')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // แปลงข้อมูลให้ตรงกับ BackupMetadata
      return (data || []).map(log => {
        const newValues = log.new_values as any;
        return {
          id: log.id,
          timestamp: log.created_at,
          version: newValues?.version || '1.0.0',
          tables: newValues?.tables || [],
          size: newValues?.size || 0,
          checksum: newValues?.checksum || '',
          status: newValues?.status || 'completed'
        };
      });
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // ลบ backup
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // ลบไฟล์ backup
      await this.deleteBackupFile(backupId);
      
      // ลบ metadata จาก audit_logs
      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .eq('id', backupId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  // ตรวจสอบความสมบูรณ์ของ backup
  async validateBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) return false;

      const backupData = await this.loadBackup(backupId);
      const currentChecksum = await this.calculateChecksum(backupData);

      return currentChecksum === metadata.checksum;
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }

  // Private methods
  private async getTableSchemas(): Promise<any> {
    // ดึง schema information จาก database
    const schemas: any = {};
    
    for (const table of this.config.tables) {
      try {
        const { data, error } = await (supabase as any)
          .rpc('get_table_schema' as any, { table_name: table });

        if (!error && data) {
          schemas[table] = data;
        }
      } catch (error) {
        console.warn(`Failed to get schema for table ${table}:`, error);
      }
    }

    return schemas;
  }

  private async compressData(data: any): Promise<any> {
    // ใช้ LZ-string หรือ library อื่นสำหรับ compression
    const jsonString = JSON.stringify(data);
    // ในระบบจริงควรใช้ compression library
    return jsonString;
  }

  private async decompressData(data: any): Promise<any> {
    // ขยายข้อมูลที่บีบอัด
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  private async encryptData(data: any): Promise<any> {
    // เข้ารหัสข้อมูล
    const jsonString = JSON.stringify(data);
    // ในระบบจริงควรใช้ encryption library
    return btoa(jsonString);
  }

  private async decryptData(data: any): Promise<any> {
    // ถอดรหัสข้อมูล
    try {
      const jsonString = atob(data);
      return JSON.parse(jsonString);
    } catch {
      return data;
    }
  }

  private async calculateChecksum(data: any): Promise<string> {
    // คำนวณ checksum ของข้อมูล
    const jsonString = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  private async saveBackup(backupId: string, data: any): Promise<number> {
    // บันทึก backup ลง storage
    // ในระบบจริงควรใช้ Supabase Storage หรือ external storage
    const jsonString = JSON.stringify(data);
    localStorage.setItem(`backup_${backupId}`, jsonString);
    return jsonString.length;
  }

  private async loadBackup(backupId: string): Promise<any> {
    // โหลด backup จาก storage
    const data = localStorage.getItem(`backup_${backupId}`);
    if (!data) {
      throw new Error('Backup file not found');
    }
    return JSON.parse(data);
  }

  private async deleteBackupFile(backupId: string): Promise<void> {
    // ลบไฟล์ backup
    localStorage.removeItem(`backup_${backupId}`);
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    // บันทึก metadata ลง audit_logs
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: 'backup_created',
        table_name: 'backup',
        old_values: null,
        new_values: metadata as any,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', backupId)
      .eq('action', 'backup_created')
      .single();

    if (error) return null;
    
    // แปลงข้อมูลให้ตรงกับ BackupMetadata
    const newValues = data.new_values as any;
    return {
      id: data.id,
      timestamp: data.created_at,
      version: newValues?.version || '1.0.0',
      tables: newValues?.tables || [],
      size: newValues?.size || 0,
      checksum: newValues?.checksum || '',
      status: newValues?.status || 'completed'
    };
  }
}

// สร้าง backup service instance
export const backupService = new BackupService({
  tables: [
    'users',
    'queues',
    'lockers',
    'payments',
    'admin_users',
    'system_settings',
    'audit_logs',
    'security_alerts'
  ],
  includeData: true,
  includeSchema: true,
  compression: true,
  encryption: false
});

// Hook สำหรับใช้ backup service
export const useBackup = () => {
  const createBackup = async () => {
    try {
      const metadata = await backupService.createBackup();
      return { success: true, metadata };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const restoreBackup = async (backupId: string, config?: Partial<RestoreConfig>) => {
    try {
      await backupService.restoreBackup({
        backupId,
        overwrite: false,
        validate: true,
        ...config
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const listBackups = async () => {
    try {
      const backups = await backupService.listBackups();
      return { success: true, backups };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      await backupService.deleteBackup(backupId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const validateBackup = async (backupId: string) => {
    try {
      const isValid = await backupService.validateBackup(backupId);
      return { success: true, isValid };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    createBackup,
    restoreBackup,
    listBackups,
    deleteBackup,
    validateBackup
  };
}; 