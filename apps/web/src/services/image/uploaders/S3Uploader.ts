import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { ImageUploader } from '../ImageUploader';

interface S3Config {
    endpoint: string;           // 必填，如 https://s3.amazonaws.com
    region: string;             // 必填，如 us-east-1
    accessKeyId: string;        // 必填
    secretAccessKey: string;    // 必填
    bucket: string;             // 必填
    pathPrefix?: string;        // 可选，路径前缀
    customDomain?: string;      // 可选，自定义域名
    forcePathStyle?: boolean | string;   // 可选，MinIO 等需要设为 true
}

// 辅助函数：将可能的字符串转为布尔值
const toBoolean = (value: boolean | string | undefined): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return false;
};

/**
 * S3 兼容图床
 * 支持 AWS S3、Cloudflare R2、MinIO、DigitalOcean Spaces 等
 */
export class S3Uploader implements ImageUploader {
    name = 'S3 兼容存储';
    private config: S3Config;
    private client: S3Client | null = null;

    constructor(config: S3Config) {
        this.config = config;
    }

    configure(config: S3Config) {
        this.config = config;
        this.client = null; // 配置变更时重置 client
    }

    /** 获取或创建 S3Client 实例（复用） */
    private getClient(): S3Client {
        if (!this.client) {
            let endpoint = this.config.endpoint;
            // 自动补全协议头
            if (endpoint && !endpoint.startsWith('http')) {
                endpoint = `https://${endpoint}`;
            }

            this.client = new S3Client({
                endpoint,
                region: this.config.region,
                credentials: {
                    accessKeyId: this.config.accessKeyId,
                    secretAccessKey: this.config.secretAccessKey,
                },
                forcePathStyle: toBoolean(this.config.forcePathStyle),
            });
        }
        return this.client;
    }

    async validate(): Promise<boolean> {
        try {
            const { endpoint, region, accessKeyId, secretAccessKey, bucket } = this.config;
            if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
                return false;
            }

            const client = this.getClient();

            // 上传测试文件验证配置
            const testKey = `_test_${Date.now()}.txt`;
            await client.send(new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: testKey,
                Body: new TextEncoder().encode('test'),
                ContentType: 'text/plain',
            }));

            // 清理测试文件
            await client.send(new DeleteObjectCommand({
                Bucket: this.config.bucket,
                Key: testKey,
            }));

            return true;
        } catch (e) {
            console.error('S3 连接测试失败:', e);
            return false;
        }
    }

    async upload(file: File): Promise<string> {
        const client = this.getClient();

        const filename = `${Date.now()}_${file.name}`;
        const key = this.config.pathPrefix
            ? `${this.config.pathPrefix.replace(/\/$/, '')}/${filename}`
            : filename;

        const arrayBuffer = await file.arrayBuffer();

        try {
            await client.send(new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: key,
                Body: new Uint8Array(arrayBuffer),
                ContentType: file.type || 'application/octet-stream',
            }));

            // 构建访问 URL
            if (this.config.customDomain) {
                const domain = this.config.customDomain.replace(/\/$/, '');
                return `${domain}/${key}`;
            }

            // 默认 S3 URL 格式
            const url = new URL(this.config.endpoint);
            if (this.config.forcePathStyle) {
                return `${url.origin}/${this.config.bucket}/${key}`;
            }
            return `${url.protocol}//${this.config.bucket}.${url.host}/${key}`;
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            throw new Error(`上传失败: ${message}`);
        }
    }
}
