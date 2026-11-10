"use client"

import * as React from "react"
import { toast } from "sonner"

import { RegionCombobox, type RegionOption } from "@/components/region-combobox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const apiUrl = "https://www.emsifa.com/api-wilayah-indonesia/v2"

export function SchoolAddressFields({
  initialProvince,
  initialRegency,
  initialDistrict,
  initialVillage,
  initialPostalCode,
  onChange,
}: {
  initialProvince: string
  initialRegency: string
  initialDistrict: string
  initialVillage: string
  initialPostalCode: string
  onChange?: () => void
}) {
  const [provinces, setProvinces] = React.useState<RegionOption[]>([])
  const [regencies, setRegencies] = React.useState<RegionOption[]>([])
  const [districts, setDistricts] = React.useState<RegionOption[]>([])
  const [villages, setVillages] = React.useState<RegionOption[]>([])
  const [province, setProvince] = React.useState<RegionOption | null>(
    savedOption(initialProvince)
  )
  const [regency, setRegency] = React.useState<RegionOption | null>(
    savedOption(initialRegency)
  )
  const [district, setDistrict] = React.useState<RegionOption | null>(
    savedOption(initialDistrict)
  )
  const [village, setVillage] = React.useState<RegionOption | null>(
    savedOption(initialVillage)
  )
  const [postalCode, setPostalCode] = React.useState(initialPostalCode)
  const [loading, setLoading] = React.useState({
    province: true,
    regency: false,
    district: false,
    village: false,
  })

  React.useEffect(() => {
    let active = true
    fetchRegions("provinces.json")
      .then((options) => {
        if (!active) return
        setProvinces(options)
        const saved = findByName(options, initialProvince)
        if (!saved) return
        setProvince(saved)
        return loadInitialAddress(saved)
      })
      .catch(showLoadError)
      .finally(() => {
        if (active) {
          setLoading({
            province: false,
            regency: false,
            district: false,
            village: false,
          })
        }
      })

    async function loadInitialAddress(selectedProvince: RegionOption) {
      setLoading((current) => ({ ...current, regency: true }))
      const nextRegencies = await fetchRegions(
        `regencies/${selectedProvince.id}.json`
      )
      if (!active) return
      setRegencies(nextRegencies)
      setLoading((current) => ({ ...current, regency: false }))
      const savedRegency = findByName(nextRegencies, initialRegency)
      if (!savedRegency) return
      setRegency(savedRegency)

      setLoading((current) => ({ ...current, district: true }))
      const nextDistricts = await fetchRegions(
        `districts/${savedRegency.id}.json`
      )
      if (!active) return
      setDistricts(nextDistricts)
      setLoading((current) => ({ ...current, district: false }))
      const savedDistrict = findByName(nextDistricts, initialDistrict)
      if (!savedDistrict) return
      setDistrict(savedDistrict)

      setLoading((current) => ({ ...current, village: true }))
      const nextVillages = await fetchRegions(
        `villages/${savedDistrict.id}.json`
      )
      if (!active) return
      setVillages(nextVillages)
      setLoading((current) => ({ ...current, village: false }))
      const savedVillage = findByName(nextVillages, initialVillage)
      if (savedVillage) setVillage(savedVillage)
    }

    return () => {
      active = false
    }
  }, [initialDistrict, initialProvince, initialRegency, initialVillage])

  async function selectProvince(option: RegionOption) {
    onChange?.()
    setProvince(option)
    setRegency(null)
    setDistrict(null)
    setVillage(null)
    setRegencies([])
    setDistricts([])
    setVillages([])
    setPostalCode("")
    setLoading((current) => ({ ...current, regency: true }))
    try {
      setRegencies(await fetchRegions(`regencies/${option.id}.json`))
    } catch {
      showLoadError()
    } finally {
      setLoading((current) => ({ ...current, regency: false }))
    }
  }

  async function selectRegency(option: RegionOption) {
    onChange?.()
    setRegency(option)
    setDistrict(null)
    setVillage(null)
    setDistricts([])
    setVillages([])
    setPostalCode("")
    setLoading((current) => ({ ...current, district: true }))
    try {
      setDistricts(await fetchRegions(`districts/${option.id}.json`))
    } catch {
      showLoadError()
    } finally {
      setLoading((current) => ({ ...current, district: false }))
    }
  }

  async function selectDistrict(option: RegionOption) {
    onChange?.()
    setDistrict(option)
    setVillage(null)
    setVillages([])
    setPostalCode("")
    setLoading((current) => ({ ...current, village: true }))
    try {
      setVillages(await fetchRegions(`villages/${option.id}.json`))
    } catch {
      showLoadError()
    } finally {
      setLoading((current) => ({ ...current, village: false }))
    }
  }

  return (
    <>
      <RegionField label="Province" htmlFor="province">
        <RegionCombobox
          id="province"
          name="province"
          value={province}
          options={provinces}
          placeholder="Select province"
          searchPlaceholder="Search province..."
          loading={loading.province}
          onChange={selectProvince}
        />
      </RegionField>
      <RegionField label="Regency / City" htmlFor="regency">
        <RegionCombobox
          id="regency"
          name="regency"
          value={regency}
          options={regencies}
          placeholder="Select regency or city"
          searchPlaceholder="Search regency or city..."
          disabled={!province}
          loading={loading.regency}
          onChange={selectRegency}
        />
      </RegionField>
      <RegionField label="District" htmlFor="district">
        <RegionCombobox
          id="district"
          name="district"
          value={district}
          options={districts}
          placeholder="Select district"
          searchPlaceholder="Search district..."
          disabled={!regency}
          loading={loading.district}
          onChange={selectDistrict}
        />
      </RegionField>
      <RegionField label="Village / Urban Village" htmlFor="village">
        <RegionCombobox
          id="village"
          name="village"
          value={village}
          options={villages}
          placeholder="Select village"
          searchPlaceholder="Search village..."
          disabled={!district}
          loading={loading.village}
          onChange={(option) => {
            onChange?.()
            setVillage(option)
            if (option.postal_code) setPostalCode(option.postal_code)
          }}
        />
      </RegionField>
      <Field>
        <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
        <Input
          id="postalCode"
          name="postalCode"
          inputMode="numeric"
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          onInput={onChange}
          maxLength={10}
        />
      </Field>
    </>
  )
}

function RegionField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Field>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
    </Field>
  )
}

async function fetchRegions(path: string) {
  const response = await fetch(`${apiUrl}/${path}`)
  if (!response.ok) throw new Error(`Region API returned ${response.status}`)
  const payload = (await response.json()) as { data?: RegionOption[] }
  if (!Array.isArray(payload.data))
    throw new Error("Invalid region API response")
  return payload.data
}

function findByName(options: RegionOption[], name: string) {
  return options.find(
    (option) =>
      option.name.toLocaleLowerCase("id") === name.toLocaleLowerCase("id")
  )
}

function savedOption(name: string): RegionOption | null {
  return name ? { id: `saved:${name}`, name } : null
}

function showLoadError() {
  toast.error("Could not load Indonesian region data.", {
    id: "region-api-error",
  })
}
