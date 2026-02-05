import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SettingsService } from "./settings.service";
import {
  UpdateCompanyDto,
  UpdateNotificationsDto,
  UpdatePermissionsDto,
  ViewSettingsDto,
  GeneralSettingsDto,
  UpdateUserPermissionsDto,
  UpdateViewProfilesDto,
} from "./dto/settings.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get tenant settings" })
  async getSettings(@Request() req) {
    return this.settingsService.getSettings(req.user.tenantId);
  }

  @Get("permissions")
  @ApiOperation({ summary: "Get all permissions" })
  async getPermissions(@Request() req) {
    return this.settingsService.getPermissions(req.user.tenantId);
  }

  @Get("permissions/user")
  @ApiOperation({ summary: "Get current user permissions" })
  async getUserPermissions(@Request() req) {
    return this.settingsService.getUserPermissions(
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get("permissions/check")
  @ApiOperation({ summary: "Check specific permission" })
  async checkPermission(
    @Request() req,
    @Query("module") module: string,
    @Query("action") action: string,
  ) {
    const hasPermission = await this.settingsService.checkPermission(
      req.user.tenantId,
      req.user.role,
      module,
      action,
    );
    return { hasPermission, module, action };
  }

  @Patch("company")
  @ApiOperation({ summary: "Update company information" })
  async updateCompany(@Request() req, @Body() data: UpdateCompanyDto) {
    return this.settingsService.updateCompany(req.user.tenantId, data);
  }

  @Patch("notifications")
  @ApiOperation({ summary: "Update notification settings" })
  async updateNotifications(
    @Request() req,
    @Body() data: UpdateNotificationsDto,
  ) {
    return this.settingsService.updateNotifications(req.user.tenantId, data);
  }

  @Post("notifications/test-email")
  @ApiOperation({ summary: "Test SMTP email configuration" })
  async testEmailConnection(
    @Request() req,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.settingsService.testEmailConnection(req.user.tenantId, userEmail);
  }

  @Patch("permissions")
  @ApiOperation({ summary: "Update permissions (Admin only)" })
  async updatePermissions(@Request() req, @Body() data: UpdatePermissionsDto) {
    return this.settingsService.updatePermissions(
      req.user.tenantId,
      req.user.role,
      data,
    );
  }

  @Post("permissions/reset")
  @ApiOperation({ summary: "Reset permissions to default (Admin only)" })
  async resetPermissions(@Request() req) {
    return this.settingsService.resetPermissionsToDefault(
      req.user.tenantId,
      req.user.role,
    );
  }

  @Patch("view")
  @ApiOperation({ summary: "Update view settings" })
  async updateViewSettings(@Request() req, @Body() data: ViewSettingsDto) {
    return this.settingsService.updateViewSettings(req.user.tenantId, data);
  }

  @Patch("general")
  @ApiOperation({ summary: "Update general settings" })
  async updateGeneralSettings(
    @Request() req,
    @Body() data: GeneralSettingsDto,
  ) {
    return this.settingsService.updateGeneralSettings(
      req.user.tenantId,
      req.user.role,
      data,
    );
  }

  // ====== ENDPOINTS PARA PERMISSÕES INDIVIDUAIS DE USUÁRIO ======

  @Get("view-profiles")
  @ApiOperation({ summary: "Get all view profiles" })
  async getViewProfiles(@Request() req) {
    return this.settingsService.getViewProfiles(req.user.tenantId);
  }

  @Patch("view-profiles")
  @ApiOperation({ summary: "Update view profiles (Admin only)" })
  async updateViewProfiles(
    @Request() req,
    @Body() data: UpdateViewProfilesDto,
  ) {
    return this.settingsService.updateViewProfiles(
      req.user.tenantId,
      req.user.role,
      data,
    );
  }

  @Get("users-permissions")
  @ApiOperation({ summary: "Get all users with their permissions" })
  async getAllUsersWithPermissions(@Request() req) {
    return this.settingsService.getAllUsersWithPermissions(req.user.tenantId);
  }

  @Get("user-permissions/:userId")
  @ApiOperation({ summary: "Get individual user permissions" })
  async getUserIndividualPermissions(
    @Request() req,
    @Param("userId") userId: string,
  ) {
    return this.settingsService.getUserIndividualPermissions(
      req.user.tenantId,
      userId,
    );
  }

  @Patch("user-permissions")
  @ApiOperation({ summary: "Update individual user permissions" })
  async updateUserIndividualPermissions(
    @Request() req,
    @Body() data: UpdateUserPermissionsDto,
  ) {
    return this.settingsService.updateUserIndividualPermissions(
      req.user.tenantId,
      req.user.role,
      data,
    );
  }

  @Post("user-permissions/:userId/reset")
  @ApiOperation({ summary: "Reset user permissions to default for their role" })
  async resetUserPermissionsToDefault(
    @Request() req,
    @Param("userId") userId: string,
  ) {
    return this.settingsService.resetUserPermissionsToDefault(
      req.user.tenantId,
      req.user.role,
      userId,
    );
  }

  @Get("user-permissions/:userId/effective")
  @ApiOperation({
    summary: "Get effective user permissions (combining role and individual)",
  })
  async getEffectiveUserPermissions(
    @Request() req,
    @Param("userId") userId: string,
  ) {
    return this.settingsService.getEffectiveUserPermissions(
      req.user.tenantId,
      userId,
    );
  }

  @Get("my-permissions")
  @ApiOperation({ summary: "Get current logged in user effective permissions" })
  async getMyEffectivePermissions(@Request() req) {
    return this.settingsService.getEffectiveUserPermissions(
      req.user.tenantId,
      req.user.userId,
    );
  }
}
